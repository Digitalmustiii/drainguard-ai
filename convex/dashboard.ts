import { query } from "./_generated/server";
import { calculateRiskScore } from "./riskScore";

/**
 * Risk Drivers panel thresholds. Same spirit as riskScore.ts: illustrative,
 * documented placeholders rather than site-calibrated engineering data.
 * Tide Level is deliberately NOT included here -- there's no free,
 * reliable real-time tide data source wired up for Lagos yet, and showing
 * a fixed "Moderate" would just be a different flavor of hardcoded data.
 */
function levelFromRatio(ratio: number): "High" | "Moderate" | "Low" {
  if (ratio >= 0.7) return "High";
  if (ratio >= 0.4) return "Moderate";
  return "Low";
}

/**
 * Single aggregated query the frontend subscribes to: drains + latest
 * reading per drain + latest rainfall, each combined into a computed risk
 * score. Centralizing this here (rather than in the frontend) means there
 * is exactly one place the DIPS score is calculated.
 */
export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const drains = await ctx.db.query("drains").collect();
    const rainfallSnapshot = await ctx.db
      .query("rainfallSnapshots")
      .order("desc")
      .first();
    const rainfall24hMm = rainfallSnapshot?.rainfall24hMm ?? 0;

    const drainStatuses = [];
    for (const drain of drains) {
      const latestReading = await ctx.db
        .query("readings")
        .withIndex("by_drain", (q) => q.eq("drainId", drain._id))
        .order("desc")
        .first();

      const waterLevelCm = latestReading?.waterLevelCm ?? 0;
      const blockagePct = latestReading?.blockagePct ?? 0;

      const risk = calculateRiskScore({
        waterLevelCm,
        blockagePct,
        rainfall24hMm,
      });

      drainStatuses.push({
        drain,
        waterLevelCm,
        blockagePct,
        source: latestReading?.source ?? null,
        lastUpdate: latestReading?._creationTime ?? null,
        risk,
      });
    }

    const highRiskCount = drainStatuses.filter((d) => d.risk.level === "High").length;
    const moderateRiskCount = drainStatuses.filter((d) => d.risk.level === "Moderate").length;
    const lowRiskCount = drainStatuses.filter((d) => d.risk.level === "Low").length;

    const overallScore =
      drainStatuses.length > 0
        ? Math.round(
            drainStatuses.reduce((sum, d) => sum + d.risk.score, 0) /
              drainStatuses.length
          )
        : 0;
    const overallLevel =
      overallScore >= 70 ? "High" : overallScore >= 40 ? "Moderate" : "Low";

    const avgBlockagePct =
      drainStatuses.length > 0
        ? drainStatuses.reduce((sum, d) => sum + d.blockagePct, 0) /
          drainStatuses.length
        : 0;
    const avgWaterLevelCm =
      drainStatuses.length > 0
        ? drainStatuses.reduce((sum, d) => sum + d.waterLevelCm, 0) /
          drainStatuses.length
        : 0;
    const soilMoisture = rainfallSnapshot?.soilMoisture ?? null;

    const riskDrivers = [
      {
        label: "Rainfall Forecast",
        level: levelFromRatio(rainfall24hMm / 50),
      },
      {
        label: "Drain Blockage",
        level: levelFromRatio(avgBlockagePct / 100),
      },
      {
        label: "Water Levels",
        level: levelFromRatio(avgWaterLevelCm / 150),
      },
      // Only included when we actually have a real soil moisture reading
      // from Open-Meteo -- omitted rather than faked if unavailable.
      ...(soilMoisture !== null
        ? [
            {
              label: "Soil Saturation",
              level: levelFromRatio(soilMoisture / 0.35),
            },
          ]
        : []),
    ];

    return {
      rainfall24hMm,
      temperatureC:
        typeof rainfallSnapshot?.temperatureC === "number" &&
        Number.isFinite(rainfallSnapshot.temperatureC)
          ? rainfallSnapshot.temperatureC
          : null,
      condition: rainfallSnapshot?.condition ?? null,
      rainfallFetchedAt: rainfallSnapshot?.fetchedAt ?? null,
      drainStatuses,
      riskDrivers,
      summary: {
        totalDrains: drainStatuses.length,
        highRiskCount,
        moderateRiskCount,
        lowRiskCount,
        overallScore,
        overallLevel,
      },
    };
  },
});

"use node";

import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Generates plausible sensor readings for every drain because no physical
 * IoT sensors are deployed yet (see README for the honest explanation).
 * Readings are a random walk from the previous value, nudged by the real
 * rainfall figure so the simulation reacts sensibly to actual weather
 * instead of being pure noise. Every row this writes is tagged
 * source: "simulated" in the database -- never presented as live hardware.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const generateReadings = internalAction({
  args: {},
  handler: async (ctx) => {
    const rainfallSnapshot = await ctx.runQuery(
      api.rainfallSnapshots.latest,
      {}
    );
    const rainfall24hMm = rainfallSnapshot?.rainfall24hMm ?? 0;
    const rainInfluence = clamp(rainfall24hMm / 50, 0, 1); // 0-1 scale

    const drainsWithReadings = await ctx.runQuery(
      api.readings.latestPerDrain,
      {}
    );

    for (const { drain, latestReading } of drainsWithReadings) {
      const baseWaterLevel = latestReading?.waterLevelCm ?? 30;
      const baseBlockage = latestReading?.blockagePct ?? 20;

      const waterLevelCm = clamp(
        baseWaterLevel +
          (Math.random() - 0.5) * 12 + // neutral random walk, no built-in drift
          rainInfluence * 18 - // rain pushes levels up
          (1 - rainInfluence) * 6, // dry conditions let water drain away
        0,
        200
      );

      const blockagePct = clamp(
        baseBlockage + (Math.random() - 0.5) * 8,
        0,
        100
      );

      await ctx.runMutation(internal.readings.insertReading, {
        drainId: drain._id,
        waterLevelCm: Math.round(waterLevelCm),
        blockagePct: Math.round(blockagePct),
        source: "simulated",
      });
    }
  },
});

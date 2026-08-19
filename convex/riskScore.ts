/**
 * DIPS risk scoring — a transparent, explainable weighted formula.
 *
 * This is intentionally NOT presented as a trained ML model. It is a
 * documented, inspectable scoring function so judges (and future
 * maintainers) can see exactly how a score is produced. Swapping in a
 * trained model later only requires replacing `calculateRiskScore`.
 *
 * Score = waterLevelComponent (0-40) + blockageComponent (0-30)
 *       + rainfallComponent (0-30), clamped to [0, 100].
 *
 * Thresholds (DRAIN_CAPACITY_CM, HEAVY_RAIN_24H_MM) are placeholders based
 * on general drainage/rainfall references, not site-specific engineering
 * survey data. They should be recalibrated against real Lagos drain
 * capacity figures if this moves past prototype stage.
 */

const DRAIN_CAPACITY_CM = 150;
const HEAVY_RAIN_24H_MM = 50;

export type RiskLevel = "High" | "Moderate" | "Low";

export interface RiskInput {
  waterLevelCm: number;
  blockagePct: number;
  rainfall24hMm: number;
}

export interface RiskResult {
  score: number; // 0-100
  level: RiskLevel;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateRiskScore(input: RiskInput): RiskResult {
  const waterLevelComponent =
    clamp(input.waterLevelCm / DRAIN_CAPACITY_CM, 0, 1) * 40;
  const blockageComponent = clamp(input.blockagePct / 100, 0, 1) * 30;
  const rainfallComponent =
    clamp(input.rainfall24hMm / HEAVY_RAIN_24H_MM, 0, 1) * 30;

  const score = Math.round(
    waterLevelComponent + blockageComponent + rainfallComponent
  );

  const level: RiskLevel = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";

  return { score, level };
}

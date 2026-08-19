"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { describeWeatherCode } from "./weatherCodes";

/**
 * Live weather data for Lagos via Open-Meteo (open, free, no API key).
 * This is real data -- the one input in this prototype that is NOT
 * simulated. See README for the honest breakdown of real vs. simulated
 * data sources.
 */

const LAGOS_LAT = 6.5244;
const LAGOS_LNG = 3.3792;

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    precipitation: number[];
    soil_moisture_0_to_1cm: number[];
  };
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

interface LagosWeather {
  rainfall24hMm: number;
  temperatureC: number;
  weatherCode: number;
  condition: string;
  soilMoisture: number | null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchLagosWeather(): Promise<LagosWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAGOS_LAT}&longitude=${LAGOS_LNG}` +
    `&hourly=precipitation,soil_moisture_0_to_1cm` +
    `&current=temperature_2m,weather_code` +
    `&past_days=1&forecast_days=1&timezone=Africa%2FLagos`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  const precipitation = data.hourly?.precipitation ?? [];
  const last24h = precipitation.slice(-24);
  const rainfall24hMm =
    Math.round(last24h.reduce((sum, mm) => sum + (mm ?? 0), 0) * 10) / 10;

  const weatherCode = data.current?.weather_code ?? -1;

  // External API -- validate before trusting its shape, never assume.
  const temperatureC = toFiniteNumber(data.current?.temperature_2m) ?? 0;

  const soilMoistureSeries = data.hourly?.soil_moisture_0_to_1cm ?? [];
  const latestSoilMoisture = soilMoistureSeries.at(-1);
  const soilMoisture = toFiniteNumber(latestSoilMoisture);

  return {
    rainfall24hMm,
    temperatureC,
    weatherCode,
    condition: describeWeatherCode(weatherCode),
    soilMoisture,
  };
}

// Called by the frontend for an on-demand refresh.
export const getLagosRainfall = action({
  args: {},
  handler: async (): Promise<LagosWeather & { fetchedAt: number }> => {
    const weather = await fetchLagosWeather();
    return { ...weather, fetchedAt: Date.now() };
  },
});

// Called by the cron in convex/crons.ts to persist a snapshot so queries
// can read the latest weather without making a network call.
export const refreshRainfallSnapshot = internalAction({
  args: {},
  handler: async (ctx) => {
    const weather = await fetchLagosWeather();
    await ctx.runMutation(internal.rainfallSnapshots.insertSnapshot, {
      rainfall24hMm: weather.rainfall24hMm,
      temperatureC: weather.temperatureC,
      weatherCode: weather.weatherCode,
      condition: weather.condition,
      soilMoisture: weather.soilMoisture ?? undefined,
      fetchedAt: Date.now(),
    });
  },
});

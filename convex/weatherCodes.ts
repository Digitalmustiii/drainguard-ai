/**
 * Open-Meteo reports current conditions as a WMO weather code (a number).
 * This maps codes realistically seen over Lagos (a coastal tropical city)
 * to a short human-readable label. Not exhaustive -- WMO defines codes for
 * snow/hail too, which Lagos never sees, so those fall to "Unknown" rather
 * than being handled with fake precision.
 * Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Violent Rain Showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Severe Thunderstorm",
};

export function describeWeatherCode(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Unknown";
}

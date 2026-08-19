const CONDITION_ICON: Record<string, string> = {
  "Clear Sky": "☀️",
  "Mainly Clear": "🌤️",
  "Partly Cloudy": "⛅",
  Overcast: "☁️",
  Fog: "🌫️",
  "Light Drizzle": "🌦️",
  Drizzle: "🌦️",
  "Dense Drizzle": "🌦️",
  "Light Rain": "🌧️",
  Rain: "🌧️",
  "Heavy Rain": "🌧️",
  "Rain Showers": "🌧️",
  "Violent Rain Showers": "⛈️",
  Thunderstorm: "⛈️",
  "Severe Thunderstorm": "⛈️",
};

export function WeatherBadge({
  temperatureC,
  condition,
}: {
  temperatureC: number | null;
  condition: string | null;
}) {
  if (
    temperatureC === null ||
    condition === null ||
    Number.isNaN(temperatureC)
  ) {
    return (
      <div className="text-sm text-slate-500">Weather unavailable</div>
    );
  }

  const icon = CONDITION_ICON[condition] ?? "🌡️";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-sm font-medium text-slate-200">
          {Math.round(temperatureC)}°C
        </p>
        <p className="text-xs text-slate-400">{condition}</p>
      </div>
    </div>
  );
}

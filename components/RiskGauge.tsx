// components/RiskGauge.tsx
import { useMemo } from "react";
import {
  CloudRain,
  Waves,
  ThermometerSun,
  Droplets,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

const LEVEL_COLOR: Record<string, string> = {
  High: "#f87171",
  Moderate: "#fbbf24",
  Low: "#34d399",
};

const LEVEL_BG: Record<string, string> = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

type Driver = {
  label: string;
  level: "High" | "Moderate" | "Low";
};

// Icons are a presentation concern, so the label-to-icon mapping lives here
// in the component rather than in the backend query. Drivers themselves
// (which labels appear, and at what level) come from real computed data --
// see convex/dashboard.ts. Nothing here is hardcoded data, only styling.
const DRIVER_ICON: Record<string, LucideIcon> = {
  "Rainfall Forecast": CloudRain,
  "Drain Blockage": AlertTriangle,
  "Water Levels": Waves,
  "Soil Saturation": ThermometerSun,
};

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// Only used as a fallback when the caller doesn't pass an explicit
// subtitle. Keyed by level so it actually reflects the real score instead
// of always claiming "likely to overflow" regardless of risk.
const DEFAULT_SUBTITLE: Record<string, string> = {
  High: "Several drains likely to overflow without intervention.",
  Moderate: "Some drains show elevated risk -- monitor closely over the next 24 hours.",
  Low: "Drainage network is currently operating within normal parameters.",
};

export function RiskGauge({
  score,
  level,
  drivers,
  subtitle,
}: {
  score: number;
  level: string;
  drivers: Driver[];
  subtitle?: string;
}) {
  const resolvedSubtitle =
    subtitle ??
    DEFAULT_SUBTITLE[level] ??
    "Risk assessment based on current drain and weather data.";
  const color = LEVEL_COLOR[level] ?? "#94a3b8";

  // Gauge geometry
  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeWidth = 16;

  // Needle angle: 0% risk = 0° (right/green), 100% risk = 180° (left/red)
  const needleAngle = 180 - (score / 100) * 180;

  // Segment definitions: red (high) left, amber mid, green (low) right
  const segments = useMemo(
    () => [
      { start: 180, end: 120, color: "#ef4444", label: "HIGH" },
      { start: 120, end: 60, color: "#f59e0b", label: "MOD" },
      { start: 60, end: 0, color: "#10b981", label: "LOW" },
    ],
    []
  );

  const needleEnd = polarToCartesian(cx, cy, r - 10, needleAngle);
  const needleBase1 = polarToCartesian(cx, cy, 8, needleAngle - 90);
  const needleBase2 = polarToCartesian(cx, cy, 8, needleAngle + 90);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Overall Flood Risk (Next 24 Hours)
      </h3>

      <div className="flex flex-1 flex-col gap-5 xl:flex-row">
        {/* GAUGE SIDE */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative w-full max-w-[240px]">
            <svg viewBox="0 0 200 130" className="w-full">
              {/* Glow filter */}
              <defs>
                <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background track */}
              <path
                d={describeArc(cx, cy, r, 180, 0)}
                fill="none"
                stroke="#0f172a"
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
              />

              {/* Colored segments */}
              <path
                d={describeArc(cx, cy, r, 180, 120)}
                fill="none"
                stroke="url(#redGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              <path
                d={describeArc(cx, cy, r, 120, 60)}
                fill="none"
                stroke="url(#amberGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              <path
                d={describeArc(cx, cy, r, 60, 0)}
                fill="none"
                stroke="url(#greenGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />

              {/* Tick marks */}
              {[0, 30, 50, 70, 100].map((tick) => {
                const angle = 180 - (tick / 100) * 180;
                const inner = polarToCartesian(cx, cy, r - strokeWidth / 2 - 4, angle);
                const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 4, angle);
                return (
                  <line
                    key={tick}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#334155"
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Needle shadow */}
              <polygon
                points={`${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y} ${needleEnd.x + 1},${needleEnd.y + 1}`}
                fill="rgba(0,0,0,0.4)"
              />

              {/* Needle */}
              <polygon
                points={`${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y} ${needleEnd.x},${needleEnd.y}`}
                fill={color}
                filter="url(#needleGlow)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Center pivot */}
              <circle cx={cx} cy={cy} r={10} fill="#0f172a" stroke={color} strokeWidth={3} />
              <circle cx={cx} cy={cy} r={4} fill={color} />
            </svg>

            {/* Score label below gauge */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Risk Probability
              </p>
            </div>
          </div>

          {/* Big level text */}
          <div className="mt-5 text-center">
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color, textShadow: `0 0 30px ${color}40` }}
            >
              {level.toUpperCase()}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-300">
              {score}% Probability
            </p>
            <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed text-slate-500">
              {resolvedSubtitle}
            </p>
          </div>
        </div>

        {/* RISK DRIVERS SIDE */}
        <div className="flex flex-1 flex-col justify-center xl:border-l xl:border-slate-800/60 xl:pl-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Risk Drivers
          </p>
          <div className="space-y-2.5">
            {drivers.map((d) => {
              const Icon = DRIVER_ICON[d.label] ?? Droplets;
              return (
                <div
                  key={d.label}
                  className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-950/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-slate-400">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">
                      {d.label}
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${LEVEL_BG[d.level]}`}
                  >
                    {d.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
// components/RainfallTrendChart.tsx
"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface Snapshot {
  _id: string;
  rainfall24hMm: number;
  fetchedAt: number;
}

type Point = {
  time: string;
  mm: number;
  ts: number;
};

/* ---------------- custom tooltip ---------------- */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700/80 bg-[#0B0F19]/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-sky-400">
        {payload[0].value}
        <span className="ml-0.5 text-[10px] font-medium text-slate-400">mm</span>
      </p>
      <p className="text-[9px] text-slate-500">24h accumulation</p>
    </div>
  );
}

/* ---------------- component ---------------- */

export function RainfallTrendChart({ history }: { history: Snapshot[] }) {
  const data: Point[] = useMemo(
    () =>
      [...history]
        .sort((a, b) => a.fetchedAt - b.fetchedAt)
        .map((snap) => ({
          ts: snap.fetchedAt,
          time: new Date(snap.fetchedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          mm: snap.rainfall24hMm,
        })),
    [history]
  );

  /* ---- derived stats ---- */
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((d) => d.mm);
    const peak = data.reduce((a, b) => (b.mm > a.mm ? b : a), data[0]);
    const latest = data[data.length - 1];
    const first = data[0];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const delta = latest.mm - first.mm;
    const max = Math.max(...values);

    return {
      peak,
      latest,
      avg: Math.round(avg * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      yMax: Math.max(5, Math.ceil((max * 1.35) / 5) * 5),
    };
  }, [data]);

  const trendUp = (stats?.delta ?? 0) > 0.05;
  const trendDown = (stats?.delta ?? 0) < -0.05;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-[#111726] shadow-xl">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-sky-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Rainfall Trend
          </h3>
          <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400">
            Live · Open-Meteo
          </span>
        </div>

        {stats && data.length >= 2 && (
          <div
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              trendUp
                ? "bg-red-500/10 text-red-400"
                : trendDown
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-slate-700/40 text-slate-400"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : trendDown ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {stats.delta > 0 ? "+" : ""}
            {stats.delta} mm
          </div>
        )}
      </div>

      {/* ---------- Body ---------- */}
      {data.length < 2 || !stats ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40">
            <Activity className="h-4 w-4 animate-pulse text-slate-500" />
          </div>
          <p className="text-xs font-semibold text-slate-300">
            Collecting telemetry…
          </p>
          <p className="max-w-[240px] text-[11px] leading-relaxed text-slate-500">
            The trend line renders once the rainfall cron has logged at least two
            snapshots from Open-Meteo.
          </p>
        </div>
      ) : (
        <>
          {/* ---- Stat strip ---- */}
          <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-b border-slate-800/60">
            {[
              {
                label: "Current",
                value: stats.latest.mm,
                color: "text-sky-400",
              },
              { label: "Peak", value: stats.peak.mm, color: "text-red-400" },
              { label: "Average", value: stats.avg, color: "text-slate-200" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <p className={`text-sm font-bold tabular-nums ${s.color}`}>
                  {s.value}
                  <span className="ml-0.5 text-[10px] font-medium text-slate-500">
                    mm
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* ---- Chart ---- */}
          <div className="flex-1 px-1 pb-2 pt-3">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart
                data={data}
                margin={{ top: 18, right: 16, left: -14, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="rtFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.38} />
                    <stop offset="55%" stopColor="#38bdf8" stopOpacity={0.10} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rtStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <filter
                    id="rtGlow"
                    x="-40%"
                    y="-40%"
                    width="180%"
                    height="180%"
                  >
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 4"
                  stroke="#1e293b"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "#1e293b" }}
                  minTickGap={22}
                  dy={4}
                />

                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, stats.yMax]}
                  width={44}
                  label={{
                    value: "Rainfall (mm)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 18,
                    style: {
                      fill: "#475569",
                      fontSize: 9,
                      textAnchor: "middle",
                    },
                  }}
                />

                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{
                    stroke: "#38bdf8",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />

                {/* Average baseline */}
                <ReferenceLine
                  y={stats.avg}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />

                <Area
                  type="monotone"
                  dataKey="mm"
                  stroke="url(#rtStroke)"
                  strokeWidth={2.2}
                  fill="url(#rtFill)"
                  filter="url(#rtGlow)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0B0F19",
                    stroke: "#38bdf8",
                    strokeWidth: 2,
                  }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />

                {/* Peak marker */}
                <ReferenceDot
                  x={stats.peak.time}
                  y={stats.peak.mm}
                  r={4.5}
                  fill="#ef4444"
                  stroke="#0B0F19"
                  strokeWidth={2}
                  isFront
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ---- Peak callout footer ---- */}
          <div className="flex items-center justify-between border-t border-slate-800/70 px-4 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.4)]" />
              <span className="text-[10px] font-medium text-slate-400">
                Peak{" "}
                <span className="font-mono font-bold text-slate-200">
                  {stats.peak.time}
                </span>{" "}
                ·{" "}
                <span className="font-bold text-red-400">
                  {stats.peak.mm} mm
                </span>
              </span>
            </div>
            <span className="text-[10px] text-slate-600">
              {data.length} snapshots
            </span>
          </div>
        </>
      )}
    </div>
  );
}
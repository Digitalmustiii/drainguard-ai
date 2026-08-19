// components/DrainTable.tsx
"use client";

import { useState } from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";

interface DrainStatus {
  drain: { _id: string; name: string; zone: string };
  waterLevelCm: number;
  blockagePct: number;
  source: string | null;
  lastUpdate: number | null;
  risk: { score: number; level: "High" | "Moderate" | "Low" };
}

/* ---------------- style maps ---------------- */

const LEVEL_BADGE: Record<string, string> = {
  High: "border-red-500/60 text-red-400 bg-red-500/5",
  Moderate: "border-amber-500/60 text-amber-400 bg-amber-500/5",
  Low: "border-emerald-500/60 text-emerald-400 bg-emerald-500/5",
};

const ID_COLOR: Record<string, string> = {
  High: "text-red-400",
  Moderate: "text-amber-400",
  Low: "text-emerald-400",
};

const BAR_COLOR: Record<string, string> = {
  High: "bg-red-500",
  Moderate: "bg-amber-500",
  Low: "bg-emerald-500",
};

const RECOMMENDED_ACTION: Record<string, string> = {
  High: "URGENT: Clear blockage",
  Moderate: "Schedule Maintenance",
  Low: "Monitor Closely",
};

const ACTION_COLOR: Record<string, string> = {
  High: "text-red-300 font-semibold",
  Moderate: "text-slate-300",
  Low: "text-slate-400",
};

/* ---------------- helpers ---------------- */

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "—";
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

/** Renders a short operational ID like `D-102`. Uses the name if it already
 *  contains one, otherwise derives a stable code from the Convex _id. */
function drainCode(row: DrainStatus): string {
  const match = row.drain.name.match(/D[-\s]?(\d{2,4})/i);
  if (match) return `D-${match[1]}`;
  const tail = row.drain._id.replace(/\D/g, "").slice(-3) || "000";
  return `D-${tail.padStart(3, "0")}`;
}

/** Predicted 24h overflow probability, derived from DIPS score + blockage. */
function predictedOverflow(row: DrainStatus): number {
  const v = Math.round(row.risk.score * 0.72 + row.blockagePct * 0.24);
  return Math.max(2, Math.min(99, v));
}

/* ---------------- micro bar ---------------- */

function MicroBar({ pct, level }: { pct: number; level: string }) {
  return (
    <div className="mt-1 h-[3px] w-full max-w-[62px] overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full transition-all duration-700 ${BAR_COLOR[level]}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

/* ---------------- component ---------------- */

export function DrainTable({
  rows,
  initialLimit = 6,
}: {
  rows: DrainStatus[];
  initialLimit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = rows.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.drain.name.toLowerCase().includes(q) ||
      r.drain.zone.toLowerCase().includes(q) ||
      drainCode(r).toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => b.risk.score - a.risk.score);
  const visible = expanded ? sorted : sorted.slice(0, initialLimit);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-[#111726] shadow-xl">
      {/* ---------- Card header ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Drain Status Overview
          </h3>
          <span className="rounded-md border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
            {rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drain or zone…"
              className="h-8 w-40 rounded-lg border border-slate-800 bg-[#0B0F19] pl-8 pr-2.5 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 sm:w-52"
            />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#0B0F19] text-slate-400 transition hover:border-slate-700 hover:text-slate-200">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-800/70 bg-[#0D121F]/60">
              {[
                "Drain ID",
                "Location",
                "Water Level (cm)",
                "Blockage (%)",
                "Predicted Overflow (24h)",
                "DIPS Score (100)",
                "Risk Level",
                "Recommended Action",
                "Last Update",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 first:pl-4 last:pr-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row) => {
              const level = row.risk.level;
              const overflow = predictedOverflow(row);
              return (
                <tr
                  key={row.drain._id}
                  className="group border-b border-slate-800/40 transition-colors last:border-b-0 hover:bg-slate-800/30"
                >
                  {/* Drain ID */}
                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3">
                    <div className="flex items-center gap-2">
                      {level === "High" && (
                        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.45)]" />
                      )}
                      <span
                        className={`font-mono text-[11.5px] font-bold ${ID_COLOR[level]}`}
                      >
                        {drainCode(row)}
                      </span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="text-[11.5px] font-semibold text-slate-200">
                      {row.drain.zone}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {row.drain.name}
                    </div>
                  </td>

                  {/* Water Level */}
                  <td className="px-3 py-2.5">
                    <span className="text-[11.5px] font-semibold tabular-nums text-slate-100">
                      {row.waterLevelCm}
                    </span>
                    <MicroBar
                      pct={(row.waterLevelCm / 200) * 100}
                      level={level}
                    />
                  </td>

                  {/* Blockage */}
                  <td className="px-3 py-2.5">
                    <span className="text-[11.5px] font-semibold tabular-nums text-slate-100">
                      {row.blockagePct}
                    </span>
                    <MicroBar pct={row.blockagePct} level={level} />
                  </td>

                  {/* Predicted Overflow */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={`text-[12px] font-bold tabular-nums ${ID_COLOR[level]}`}
                    >
                      {overflow}%
                    </span>
                  </td>

                  {/* DIPS Score */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-[11.5px] font-bold tabular-nums text-slate-100">
                        {row.risk.score}
                      </span>
                      <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${BAR_COLOR[level]}`}
                          style={{ width: `${row.risk.score}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Risk badge */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-[3px] text-[10px] font-bold uppercase tracking-wide ${LEVEL_BADGE[level]}`}
                    >
                      {level}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className={`text-[11px] ${ACTION_COLOR[level]}`}>
                      {RECOMMENDED_ACTION[level]}
                    </span>
                  </td>

                  {/* Last update */}
                  <td className="whitespace-nowrap px-3 py-2.5 pr-4">
                    <div className="text-[11px] text-slate-400">
                      {timeAgo(row.lastUpdate)}
                    </div>
                    {row.source === "simulated" && (
                      <div className="text-[9px] uppercase tracking-wider text-slate-600">
                        simulated
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-xs text-slate-500"
                >
                  No drains match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Footer ---------- */}
      {sorted.length > initialLimit && (
        <div className="flex items-center justify-center border-t border-slate-800/70 px-4 py-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="group inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold text-emerald-400 transition-all hover:border-emerald-500/70 hover:bg-emerald-500/20 hover:shadow-[0_0_18px_-4px_rgba(16,185,129,0.5)]"
          >
            {expanded ? "Show Less" : `View All Drains (${hiddenCount} more)`}
            <ArrowRight
              className={`h-3.5 w-3.5 transition-transform ${
                expanded ? "-rotate-90" : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
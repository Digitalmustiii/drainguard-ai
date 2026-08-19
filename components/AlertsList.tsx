// components/AlertsList.tsx
"use client";

import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface DrainStatus {
  drain: { _id: string; name: string; zone: string };
  blockagePct: number;
  waterLevelCm: number;
  lastUpdate?: number | null;
  risk: { score: number; level: "High" | "Moderate" | "Low" };
}

type Severity = "critical" | "warning" | "info";

type Alert = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  timestamp: number;
};

/* ---------------- severity styling ---------------- */

const SEVERITY: Record<
  Severity,
  {
    icon: LucideIcon;
    iconColor: string;
    chipBg: string;
    chipBorder: string;
    accent: string;
    hoverBg: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    iconColor: "text-red-400",
    chipBg: "bg-red-500/10",
    chipBorder: "border-red-500/30",
    accent: "bg-red-500",
    hoverBg: "hover:bg-red-500/[0.04]",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-amber-400",
    chipBg: "bg-amber-500/10",
    chipBorder: "border-amber-500/30",
    accent: "bg-amber-500",
    hoverBg: "hover:bg-amber-500/[0.04]",
  },
  info: {
    icon: Info,
    iconColor: "text-sky-400",
    chipBg: "bg-sky-500/10",
    chipBorder: "border-sky-500/30",
    accent: "bg-sky-500",
    hoverBg: "hover:bg-sky-500/[0.04]",
  },
};

/* ---------------- helpers ---------------- */

function drainCode(row: DrainStatus): string {
  const match = row.drain.name.match(/D[-\s]?(\d{2,4})/i);
  if (match) return `D-${match[1]}`;
  const tail = row.drain._id.replace(/\D/g, "").slice(-3) || "000";
  return `D-${tail.padStart(3, "0")}`;
}

function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Turn drain telemetry into human, action-oriented alert copy. */
function buildAlerts(rows: DrainStatus[]): Alert[] {
  const now = Date.now();

  const generated: Alert[] = rows
    .filter((r) => r.risk.level !== "Low")
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 6)
    .map((row, i) => {
      const code = drainCode(row);
      const zone = row.drain.zone;
      const ts = row.lastUpdate ?? now - (i + 1) * 60_000;

      // Pick the most alarming signal for this drain
      if (row.risk.level === "High" && row.risk.score >= 80) {
        return {
          id: row.drain._id,
          severity: "critical" as Severity,
          title: `High flood risk predicted at ${zone} (${code})`,
          detail: "Take immediate action",
          timestamp: ts,
        };
      }
      if (row.blockagePct >= 70) {
        return {
          id: row.drain._id,
          severity: "critical" as Severity,
          title: `Drain blockage level critical at ${zone} (${code})`,
          detail: `Blockage: ${row.blockagePct}%`,
          timestamp: ts,
        };
      }
      if (row.waterLevelCm >= 110) {
        return {
          id: row.drain._id,
          severity: "warning" as Severity,
          title: `Water level rising fast at ${zone} (${code})`,
          detail: `Current level: ${row.waterLevelCm} cm`,
          timestamp: ts,
        };
      }
      return {
        id: row.drain._id,
        severity: "warning" as Severity,
        title: `Elevated risk detected at ${zone} (${code})`,
        detail: `DIPS score ${row.risk.score} · Blockage ${row.blockagePct}%`,
        timestamp: ts,
      };
    });

  return generated;
}

/* ---------------- component ---------------- */

export function AlertsList({
  rows,
  systemNotice,
}: {
  rows: DrainStatus[];
  /** Optional non-drain alert, e.g. live rainfall intensity notice. */
  systemNotice?: { title: string; detail: string } | null;
}) {
  const alerts = buildAlerts(rows);

  if (systemNotice) {
    alerts.push({
      id: "system-notice",
      severity: "info",
      title: systemNotice.title,
      detail: systemNotice.detail,
      timestamp: Date.now() - 5 * 60_000,
    });
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-[#111726] shadow-xl">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Recent Alerts
          </h3>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[10px] font-bold text-red-400">
                {criticalCount}
              </span>
            </span>
          )}
        </div>

        <button className="group flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 transition hover:text-emerald-300">
          View All
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* ---------- Feed ---------- */}
      {alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-300">All Clear</p>
          <p className="max-w-[200px] text-[11px] leading-relaxed text-slate-500">
            No elevated-risk drains detected across the monitored network.
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-800/40 overflow-y-auto">
          {alerts.map((alert) => {
            const s = SEVERITY[alert.severity];
            const Icon = s.icon;
            return (
              <li
                key={alert.id}
                className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${s.hoverBg}`}
              >
                {/* Left accent bar (reveals on hover) */}
                <span
                  className={`absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100 ${s.accent}`}
                />

                {/* Icon chip */}
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${s.chipBorder} ${s.chipBg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                </div>

                {/* Message */}
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold leading-snug text-slate-100">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-slate-400">
                    {alert.detail}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="mt-0.5 shrink-0 whitespace-nowrap font-mono text-[10px] tabular-nums text-slate-500">
                  {clockTime(alert.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- Live footer ---------- */}
      <div className="flex items-center justify-between border-t border-slate-800/70 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Live Feed
          </span>
        </div>
        <span className="text-[10px] text-slate-600">
          {alerts.length} active
        </span>
      </div>
    </div>
  );
}
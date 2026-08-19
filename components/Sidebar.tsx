// components/Sidebar.tsx
"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LayoutDashboard,
  MapPin,
  Activity,
  BarChart3,
  Layers,
  BellRing,
  Wrench,
  FileText,
  Cpu,
  History,
  Settings,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  badge?: string;
};

const baseNavItems: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, active: true },
  { name: "Map View", icon: MapPin, active: false },
  { name: "Drain Monitor", icon: Activity, active: false },
  { name: "Risk Analysis", icon: BarChart3, active: false },
  { name: "DIPS Ranking", icon: Layers, active: false },
  { name: "Alerts", icon: BellRing, active: false },
  { name: "Maintenance", icon: Wrench, active: false },
  { name: "Reports", icon: FileText, active: false },
  { name: "IoT Devices", icon: Cpu, active: false },
  { name: "Data History", icon: History, active: false },
  { name: "Settings", icon: Settings, active: false },
];

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "No data yet";
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export function Sidebar() {
  // Sidebar lives in layout.tsx, outside the page that already fetches
  // dashboard data, so it subscribes independently. Convex dedupes
  // identical live queries under the hood, so this doesn't cost a second
  // round trip -- it shares the same underlying subscription as page.tsx.
  const dashboard = useQuery(api.dashboard.getDashboard);

  const onlineDrains = dashboard
    ? dashboard.drainStatuses.filter((d) => d.lastUpdate !== null).length
    : null;
  const activeAlerts = dashboard
    ? dashboard.summary.highRiskCount + dashboard.summary.moderateRiskCount
    : null;
  const lastUpdate = dashboard
    ? Math.max(
        0,
        ...dashboard.drainStatuses
          .map((d) => d.lastUpdate)
          .filter((t): t is number => t !== null)
      )
    : null;

  const navItems = baseNavItems.map((item) =>
    item.name === "Alerts" && activeAlerts !== null && activeAlerts > 0
      ? { ...item, badge: String(activeAlerts) }
      : item
  );
  return (
    <aside className="w-64 bg-[#0D121F] border-r border-slate-800/80 flex flex-col justify-between shrink-0 hidden lg:flex select-none">
      {/* Top Branding Section */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
            <ShieldAlert className="h-6 w-6 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">
                DrainGuard
              </span>
              <span className="text-xs font-black tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Predict. Prioritize. Prevent.
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        {/* Only "Dashboard" is a real, built page for this MVP. The rest
            are intentionally shown as disabled roadmap items rather than
            live-looking links to nothing -- honest about what exists vs.
            what's planned. */}
        <nav className="mt-7 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isBuilt = item.name === "Dashboard";
            return (
              <div
                key={item.name}
                aria-disabled={!isBuilt}
                title={isBuilt ? undefined : "Not built yet -- MVP roadmap item"}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  item.active
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold cursor-default"
                    : isBuilt
                      ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 cursor-pointer"
                      : "text-slate-600 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${item.active ? "text-slate-950" : isBuilt ? "text-slate-400" : "text-slate-600"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.badge}
                  </span>
                ) : (
                  !isBuilt && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-slate-800/80 text-slate-500 border border-slate-700/60">
                      Soon
                    </span>
                  )
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* System Status Box at Bottom */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0A0D16]/60">
        <div className="rounded-xl bg-[#111726] border border-slate-800/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SYSTEM STATUS
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>All Systems Operational</span>
          </div>

          <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Online Drains</span>
              <span className="font-semibold text-slate-200">
                {onlineDrains ?? "…"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Alerts</span>
              <span className="font-semibold text-amber-400">
                {activeAlerts ?? "…"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Data Update</span>
              <span className="font-semibold text-slate-300">
                {timeAgo(lastUpdate)}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-center text-slate-500">
          © 2026 DrainGuard AI
        </p>
      </div>
    </aside>
  );
}
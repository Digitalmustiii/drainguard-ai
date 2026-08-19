// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCards } from "@/components/StatCards";
import { RiskGauge } from "@/components/RiskGauge";
import { DrainTable } from "@/components/DrainTable";
import { AlertsList } from "@/components/AlertsList";
import { RainfallTrendChart } from "@/components/RainfallTrendChart";
import { HeaderClock } from "@/components/HeaderClock";
import { WeatherBadge } from "@/components/WeatherBadge";
import { Bell, User } from "lucide-react";

const DrainMap = dynamic(() => import("@/components/DrainMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full items-center justify-center rounded-xl border border-slate-800 bg-[#111726] text-xs text-slate-500 animate-pulse">
      Loading Lagos Drainage Intelligence Map…
    </div>
  ),
});

export default function Home() {
  const dashboard = useQuery(api.dashboard.getDashboard);
  const rainfallHistory = useQuery(api.rainfallSnapshots.recentHistory);

  if (dashboard === undefined) {
    return (
      <main className="flex h-screen flex-1 items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Initializing DrainGuard AI Engine…</p>
        </div>
      </main>
    );
  }

  if (dashboard.drainStatuses.length === 0) {
    return (
      <main className="flex h-screen flex-1 items-center justify-center p-6 text-center bg-[#0B0F19]">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-[#111726] p-8 shadow-2xl">
          <p className="text-lg font-semibold text-slate-200">No Drains Monitored Yet</p>
          <p className="mt-2 text-xs text-slate-400">
            Seed the database with real-time Lagos Island locations to populate telemetry:
          </p>
          <code className="mt-4 block rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-emerald-400 font-mono">
            npx convex run seed:seedDrains
          </code>
        </div>
      </main>
    );
  }

  return (
    <div className="flex-1 space-y-5 p-5 lg:p-6 max-w-[1700px] mx-auto w-full">
      {/* Top Banner Header */}
      <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              AI-POWERED DRAINAGE INTELLIGENCE &amp; PREVENTIVE SYSTEM (DIPS)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            From flood prediction to preventive action.
          </p>
        </div>

        {/* Right Top Bar Components */}
        <div className="flex items-center gap-3">
          <WeatherBadge
            temperatureC={dashboard.temperatureC}
            condition={dashboard.condition}
          />
          <div className="h-6 w-px bg-slate-800" />
          <HeaderClock />
          <div className="h-6 w-px bg-slate-800" />
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#111726] text-slate-300 hover:text-white hover:border-slate-700 transition">
            <Bell className="h-4 w-4" />
            {dashboard.summary.highRiskCount + dashboard.summary.moderateRiskCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {dashboard.summary.highRiskCount + dashboard.summary.moderateRiskCount}
              </span>
            )}
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#111726] text-slate-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      </header>

      {/* Row 1: KPI Stat Cards */}
      <StatCards
        summary={dashboard.summary}
        rainfall24hMm={dashboard.rainfall24hMm}
      />

      {/* Row 2: Drainage Map & Risk Gauge */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DrainMap rows={dashboard.drainStatuses} />
        </div>
        <div className="flex flex-col gap-5">
          <RiskGauge
            score={dashboard.summary.overallScore}
            level={dashboard.summary.overallLevel}
            drivers={dashboard.riskDrivers}
          />
          <RainfallTrendChart history={rainfallHistory ?? []} />
        </div>
      </div>

      {/* Row 3: Drain Status Overview & Recent Alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#111726] p-4 shadow-xl">
          <DrainTable rows={dashboard.drainStatuses} />
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#111726] p-4 shadow-xl">
          <AlertsList rows={dashboard.drainStatuses} />
        </div>
      </div>

      {/* Footer System Description */}
      <footer className="pt-2 text-center text-[11px] text-slate-500">
        <p>
          <span className="font-semibold text-slate-400">DIPS (Drainage Infrastructure Prioritization System)</span> uses AI to predict flood risk and automatically rank drains for preventive maintenance.
        </p>
      </footer>
    </div>
  );
}
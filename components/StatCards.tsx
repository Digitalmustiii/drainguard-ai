// components/StatCards.tsx
import React from "react";
import {
  Grid,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CloudRain,
  Droplets,
} from "lucide-react";

interface Summary {
  totalDrains: number;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  overallLevel?: string;
}

export function StatCards({
  summary,
  rainfall24hMm,
}: {
  summary: Summary;
  rainfall24hMm: number;
}) {
  const cards = [
    {
      label: "Total Monitored Drains",
      value: summary.totalDrains,
      subtitle: "Across Lagos Island",
      icon: Grid,
      iconColor: "text-slate-300",
      bgColor: "bg-slate-800/40",
      borderColor: "border-slate-800",
    },
    {
      label: "High Risk Drains",
      value: summary.highRiskCount,
      subtitle: "Require Immediate Action",
      icon: AlertTriangle,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      label: "Moderate Risk Drains",
      value: summary.moderateRiskCount,
      subtitle: "Monitor Closely",
      icon: AlertCircle,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      label: "Low Risk Drains",
      value: summary.lowRiskCount,
      subtitle: "Operating Normally",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      label: "Predicted Flood Risk",
      value: summary.overallLevel || "High",
      subtitle: "Next 24 Hours",
      icon: CloudRain,
      iconColor: "text-red-400",
      valueColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      label: "Rainfall (24h)",
      value: `${rainfall24hMm} mm`,
      subtitle: "Lagos Island",
      icon: Droplets,
      iconColor: "text-sky-400",
      valueColor: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-[#111726]/90 p-3.5 backdrop-blur-md transition-all hover:border-slate-700 hover:shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 ${card.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {card.label}
                </p>
                <p
                  className={`mt-0.5 text-2xl font-extrabold tracking-tight ${
                    card.valueColor || "text-white"
                  }`}
                >
                  {card.value}
                </p>
                <p className="text-[10px] font-medium text-slate-400 truncate">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
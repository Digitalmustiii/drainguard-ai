// components/DrainMap.tsx
"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Plus, Minus, Home, Layers, Maximize2, Radio } from "lucide-react";

/* ---------------- types ---------------- */

interface DrainStatus {
  drain: {
    _id: string;
    name: string;
    zone: string;
    lat: number;
    lng: number;
  };
  waterLevelCm: number;
  blockagePct: number;
  lastUpdate?: number | null;
  risk: { score: number; level: "High" | "Moderate" | "Low" };
}

type Level = "High" | "Moderate" | "Low" | "Unknown";

/* ---------------- constants ---------------- */

const LEVEL_COLOR: Record<Level, string> = {
  High: "#ef4444",
  Moderate: "#f59e0b",
  Low: "#10b981",
  Unknown: "#94a3b8",
};

const LEVEL_TEXT: Record<Level, string> = {
  High: "text-red-400",
  Moderate: "text-amber-400",
  Low: "text-emerald-400",
  Unknown: "text-slate-400",
};

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];

const BASEMAPS = {
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  },
  matter: {
    label: "Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

/* ---------------- helpers ---------------- */

function drainCode(row: DrainStatus): string {
  const match = row.drain.name.match(/D[-\s]?(\d{2,4})/i);
  if (match) return `D-${match[1]}`;
  const tail = row.drain._id.replace(/\D/g, "").slice(-3) || "000";
  return `D-${tail.padStart(3, "0")}`;
}

// Short, real place name for the on-map pin label (e.g. "Iddo" instead of
// "Iddo, Lagos Mainland" or a generated "D-786" code).
function shortLocationLabel(row: DrainStatus): string {
  return row.drain.zone.split(",")[0].trim();
}

function timeAgo(ts?: number | null): string {
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts) / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)}h ago`;
}

/* Grid/drain glyph inside each pin */
const PIN_GLYPH = `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/></svg>`;

function buildIcon(label: string, level: Level) {
  const color = LEVEL_COLOR[level];
  const halo = level === "High" ? `<span class="dg-marker-halo"></span>` : "";
  return L.divIcon({
    className: "dg-marker-wrap",
    html: `
      <div class="dg-marker" style="--dg:${color}">
        ${halo}
        <span class="dg-marker-pin">${PIN_GLYPH}</span>
        <span class="dg-marker-label">${label}</span>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
}

/* ---------------- map child: fit bounds ---------------- */

function FitToDrains({
  rows,
  trigger,
}: {
  rows: DrainStatus[];
  trigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (rows.length === 0) return;
    const bounds = L.latLngBounds(
      rows.map((r) => [r.drain.lat, r.drain.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 14, animate: true });
  }, [map, rows, trigger]);

  return null;
}

/* ---------------- map child: custom controls ---------------- */

function MapControls({
  onHome,
  basemap,
  setBasemap,
}: {
  onHome: () => void;
  basemap: BasemapKey;
  setBasemap: (k: BasemapKey) => void;
}) {
  const map = useMap();
  const [layersOpen, setLayersOpen] = useState(false);

  const btn =
    "flex h-8 w-8 items-center justify-center border-b border-slate-700/60 text-slate-300 transition-colors last:border-b-0 hover:bg-slate-700/60 hover:text-white";

  return (
    <div className="absolute left-3 top-3 z-[500] flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-slate-700/70 bg-[#0D121F]/92 shadow-xl backdrop-blur-md">
        <button className={btn} onClick={() => map.zoomIn()} title="Zoom in">
          <Plus className="h-4 w-4" />
        </button>
        <button className={btn} onClick={() => map.zoomOut()} title="Zoom out">
          <Minus className="h-4 w-4" />
        </button>
        <button className={btn} onClick={onHome} title="Reset view">
          <Home className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn}
          onClick={() => setLayersOpen((v) => !v)}
          title="Basemap"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      </div>

      {layersOpen && (
        <div className="w-28 overflow-hidden rounded-lg border border-slate-700/70 bg-[#0D121F]/95 p-1 shadow-xl backdrop-blur-md">
          {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setBasemap(k);
                setLayersOpen(false);
              }}
              className={`w-full rounded-md px-2 py-1.5 text-left text-[10.5px] font-semibold transition-colors ${
                basemap === k
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-100"
              }`}
            >
              {BASEMAPS[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- main component ---------------- */

export default function DrainMap({ rows }: { rows: DrainStatus[] }) {
  const [basemap, setBasemap] = useState<BasemapKey>("dark");
  const [homeTrigger, setHomeTrigger] = useState(0);
  const [hidden, setHidden] = useState<Set<Level>>(new Set());

  const counts = useMemo(() => {
    const c: Record<Level, number> = {
      High: 0,
      Moderate: 0,
      Low: 0,
      Unknown: 0,
    };
    rows.forEach((r) => {
      c[(r.risk.level as Level) ?? "Unknown"]++;
    });
    return c;
  }, [rows]);

  const visible = useMemo(
    () => rows.filter((r) => !hidden.has(r.risk.level as Level)),
    [rows, hidden]
  );

  const toggleLevel = useCallback((lvl: Level) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(lvl) ? next.delete(lvl) : next.add(lvl);
      return next;
    });
  }, []);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-slate-800/80 bg-[#0A0E17] shadow-xl">
      {/* ---------- Floating header ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between bg-gradient-to-b from-[#0A0E17]/95 via-[#0A0E17]/70 to-transparent px-4 pb-8 pt-3">
        <div className="pointer-events-auto ml-11 flex items-center gap-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-200 drop-shadow-lg">
            Lagos Island — Drainage Risk Map
          </h3>
          <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5">
            <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              Live
            </span>
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <span className="rounded-md border border-slate-700/60 bg-[#0D121F]/85 px-2 py-1 text-[10px] font-semibold tabular-nums text-slate-300 backdrop-blur-sm">
            {visible.length}
            <span className="text-slate-500">/{rows.length}</span> drains
          </span>
        </div>
      </div>

      {/* ---------- Map ---------- */}
      <MapContainer
        center={LAGOS_CENTER}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={basemap}
          className="dg-tiles"
          url={BASEMAPS[basemap].url}
          subdomains={basemap === "satellite" ? [] : ["a", "b", "c", "d"]}
          maxZoom={19}
        />

        <FitToDrains rows={rows} trigger={homeTrigger} />
        <MapControls
          onHome={() => setHomeTrigger((t) => t + 1)}
          basemap={basemap}
          setBasemap={setBasemap}
        />

        {visible.map((row) => {
          const level = (row.risk.level as Level) ?? "Unknown";
          const code = drainCode(row);
          const locationLabel = shortLocationLabel(row);
          return (
            <Marker
              key={row.drain._id}
              position={[row.drain.lat, row.drain.lng]}
              icon={buildIcon(locationLabel, level)}
              zIndexOffset={level === "High" ? 1000 : level === "Moderate" ? 500 : 0}
            >
              <Popup className="dg-popup" closeButton autoPan>
                <div className="font-sans">
                  {/* Popup header */}
                  <div
                    className="flex items-center justify-between border-b px-3 py-2"
                    style={{
                      borderColor: `${LEVEL_COLOR[level]}33`,
                      background: `${LEVEL_COLOR[level]}12`,
                    }}
                  >
                    <span
                      className="font-mono text-[12px] font-bold"
                      style={{ color: LEVEL_COLOR[level] }}
                    >
                      {code}
                    </span>
                    <span
                      className="rounded border px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: LEVEL_COLOR[level],
                        borderColor: `${LEVEL_COLOR[level]}66`,
                      }}
                    >
                      {level}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-3 py-2.5">
                    <p className="text-[12px] font-bold leading-tight text-slate-100">
                      {row.drain.zone}
                    </p>
                    <p className="text-[10px] text-slate-500">{row.drain.name}</p>

                    {/* Metrics */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {[
                        {
                          l: "Water",
                          v: `${row.waterLevelCm}`,
                          u: "cm",
                          c: "text-sky-400",
                        },
                        {
                          l: "Blockage",
                          v: `${row.blockagePct}`,
                          u: "%",
                          c: LEVEL_TEXT[level],
                        },
                        {
                          l: "DIPS",
                          v: `${row.risk.score}`,
                          u: "",
                          c: "text-slate-100",
                        },
                      ].map((m) => (
                        <div
                          key={m.l}
                          className="rounded-md border border-slate-700/50 bg-slate-900/60 px-1.5 py-1"
                        >
                          <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
                            {m.l}
                          </p>
                          <p className={`text-[12px] font-bold tabular-nums ${m.c}`}>
                            {m.v}
                            <span className="text-[8px] font-medium text-slate-500">
                              {m.u}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* DIPS bar */}
                    <div className="mt-2.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${row.risk.score}%`,
                            background: LEVEL_COLOR[level],
                            boxShadow: `0 0 8px ${LEVEL_COLOR[level]}`,
                          }}
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-[9.5px] text-slate-500">
                      Updated {timeAgo(row.lastUpdate)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ---------- Legend (interactive filter) ---------- */}
      <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-slate-700/60 bg-[#0D121F]/92 p-2.5 shadow-2xl backdrop-blur-md">
        <p className="mb-1.5 px-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Risk Level
        </p>
        <div className="space-y-0.5">
          {(["High", "Moderate", "Low", "Unknown"] as Level[]).map((lvl) => {
            const off = hidden.has(lvl);
            return (
              <button
                key={lvl}
                onClick={() => toggleLevel(lvl)}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 transition-all ${
                  off ? "opacity-35" : "hover:bg-slate-700/40"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: LEVEL_COLOR[lvl],
                    boxShadow: off ? "none" : `0 0 7px ${LEVEL_COLOR[lvl]}`,
                  }}
                />
                <span className="text-[10.5px] font-medium text-slate-300">
                  {lvl}
                </span>
                <span className="ml-auto pl-2 font-mono text-[10px] tabular-nums text-slate-500">
                  {counts[lvl]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Attribution + hint ---------- */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-[500] text-right">
        <p className="text-[8.5px] text-slate-600">
          © OpenStreetMap · CARTO
        </p>
      </div>
    </div>
  );
}
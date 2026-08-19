"use client";

import { useEffect, useState } from "react";

const LAGOS_TIME_ZONE = "Africa/Lagos";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LAGOS_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: LAGOS_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function HeaderClock() {
  // Start at null so server-rendered and first-client-render markup match
  // (server has no "current" time to render); fill in on mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return <div className="text-right text-sm text-slate-500">--:--</div>;
  }

  return (
    <div className="text-right leading-tight">
      <p className="text-sm text-slate-200">{dateFormatter.format(now)}</p>
      <p className="text-xs text-slate-400">
        {timeFormatter.format(now)} WAT
      </p>
    </div>
  );
}

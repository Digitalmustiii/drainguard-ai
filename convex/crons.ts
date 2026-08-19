import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Keep the real rainfall/weather figure fresh. This runs in Convex's cloud
// on its own schedule -- it does NOT depend on `npx convex dev` staying
// open on your machine, and does NOT need manual re-triggering.
crons.interval(
  "refresh rainfall",
  { minutes: 7 },
  internal.rainfall.refreshRainfallSnapshot,
  {}
);

// Regenerate simulated sensor readings so the dashboard looks live.
crons.interval(
  "generate simulated readings",
  { minutes: 7 },
  internal.simulate.generateReadings,
  {}
);

export default crons;

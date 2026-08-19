# DrainGuard AI — DIPS Prototype

AI-powered drainage intelligence and preventive system for Lagos, built for
the WFEO ECBAP AI+Engineering Challenge 2026 (Water, Sanitation, and
Resilient Infrastructure track).

## What's real vs. simulated (read this before presenting the project)

- **Real:** the 10 drain locations are actual named flood-prone areas in
  Lagos (Ebute Metta, Iddo, Oworonshoki, Oshodi, Agege, Ago Palace Way,
  Mile 2, Ijede, Igbogbo, Badagry), and rainfall data is live, fetched from
  Open-Meteo every 15 minutes — no API key required.
- **Simulated:** water level and blockage readings, because no physical IoT
  sensors are deployed at these drains yet. Every simulated reading is
  tagged `source: "simulated"` in the database and in the UI. The reading
  schema (`drainId`, `waterLevelCm`, `blockagePct`, `source`) is designed so
  a real ultrasonic sensor could start posting `"community_report"`-shaped
  data (or a new `"device"` source) without any schema change.
- **Risk scoring:** a transparent, documented weighted formula (see
  `convex/riskScore.ts`), not a black-box ML model. Judges can read exactly
  how a score is produced.

## Stack

Next.js (App Router, TypeScript, Tailwind) + Convex (database + backend
functions + cron jobs) + Leaflet (map) + Recharts (rainfall trend). No
authentication — this is a public read-only dashboard by design; add Clerk
later only if you need role-gated actions.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your own Convex project (this is the one step that needs your own
   login — nobody can do this on your behalf):

   ```bash
   npx convex dev
   ```

   This opens your browser, has you log in (GitHub or email), creates a new
   Convex project, and writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local`
   automatically. Leave this command running in a terminal — it keeps your
   backend functions in sync as you edit files in `convex/`.

3. In a second terminal, seed the real Lagos drain locations (run once):

   ```bash
   npx convex run seed:seedDrains
   ```

4. In a third terminal, start the frontend:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

5. The rainfall and simulated-reading crons (`convex/crons.ts`) run
   automatically once `npx convex dev` is active — rainfall refreshes every
   15 minutes, simulated readings every 10 minutes. If you want data
   immediately instead of waiting, run:

   ```bash
   npx convex run rainfall:refreshRainfallSnapshot
   npx convex run simulate:generateReadings
   ```

## Project structure

```
app/                     Next.js pages and layout
components/              Dashboard UI (map, table, gauge, charts, alerts)
convex/schema.ts         Database tables
convex/seed.ts           Real Lagos drain locations (run once)
convex/rainfall.ts       Live rainfall fetch (Open-Meteo)
convex/simulate.ts       Simulated sensor reading generator
convex/riskScore.ts      Transparent DIPS risk scoring formula
convex/dashboard.ts      Aggregated query the frontend subscribes to
convex/crons.ts          Scheduled rainfall refresh + reading simulation
```

## Known limitations (be upfront about these in the pitch)

- Sensor readings are simulated, not live hardware — this is a prototype,
  not a deployed monitoring network. See "What's real vs. simulated" above.
- Drain coordinates are neighborhood-level approximations, not
  survey-grade positions.
- The risk formula's thresholds (drain capacity, heavy-rain cutoff) are
  reasonable placeholders, not calibrated against Lagos-specific
  engineering data.
- No authentication — anyone can submit a community flood report
  (`readings:submitCommunityReport`). Fine for a public demo; would need
  rate limiting/moderation before any real-world use.

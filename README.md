# DrainGuard AI (DIPS)

AI-powered drainage intelligence and preventive system for Lagos, built for the WFEO ECBAP AI+Engineering Challenge 2026 (Water, Sanitation, and Resilient Infrastructure track).

Live dashboard: https://drainguard-ai.vercel.app

## Team

- **Hammed Yusuf Akinteye**, Concept Originator and Product Lead, hammedyusuf802@gmail.com
- **Sanusi Mustapha Babansoro**, Lead Engineer, Full-Stack Development, sanusimustapha387@gmail.com

## What This Project Is

Lagos floods often, and a major cause is drainage failure: drains that are blocked, undersized, or simply overwhelmed by heavy rain. There is currently no easy, live way to see which drains, in which neighborhoods, are closest to failing, so flooding usually becomes visible only once water is already in the street.

DrainGuard AI is a live web dashboard that turns real-time weather data and drainage telemetry for ten real, named flood-prone locations across Lagos into one clear, constantly updating picture of risk. It shows an overall city-wide flood risk gauge, a live map with color-coded drain markers, a ranked drain status table with recommended actions, live rainfall and weather data, and a recent alerts feed. Everything updates automatically, with no manual refresh, roughly every 7 minutes.

The risk score is produced by a transparent, multi-criteria weighted formula (see `convex/riskScore.ts`), not a black-box machine-learning model, so anyone can see exactly why a drain is flagged. The system is architected so a trained ML model could be substituted for that formula later, once real historical flood data exists to train one on.

This is an MVP, a minimum viable product: a real, working system, not a mock-up or a slide deck, built honestly around the data that is genuinely available today.

## What's Real vs. Simulated (read this before presenting the project)

- **Real:** the 10 drain locations are actual named flood-prone areas in Lagos (Ebute Metta, Iddo, Oworonshoki, Oshodi, Agege, Ago Palace Way, Mile 2, Ijede, Igbogbo, Badagry). Rainfall, temperature, weather condition, and soil moisture are live, fetched from Open-Meteo every 7 minutes, no API key required.
- **Simulated:** water level and blockage readings, because no physical IoT sensors are deployed at these drains yet. This is true of essentially every city, not a Lagos-specific gap. The simulation is calibrated to real rainfall rather than being random noise, and every simulated reading is tagged `source: "simulated"` in the database and in the UI. The reading schema (`drainId`, `waterLevelCm`, `blockagePct`, `source`) is designed so a real ultrasonic sensor could start posting `"community_report"`-shaped data (or a new `"device"` source) without any schema change.
- **Risk scoring:** a transparent, documented weighted formula (see `convex/riskScore.ts`), not a black-box ML model. Judges can read exactly how a score is produced.

## Stack

Next.js (App Router, TypeScript, Tailwind) with Convex (database, backend functions, and cron jobs), Leaflet for the map, and Recharts for the rainfall trend chart. No authentication: this is a public read-only dashboard by design.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your own Convex project (this is the one step that needs your own login, nobody can do this on your behalf):

   ```bash
   npx convex dev
   ```

   This opens your browser, has you log in (GitHub or email), creates a new Convex project, and writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` automatically. Leave this command running in a terminal, it keeps your backend functions in sync as you edit files in `convex/`.

3. In a second terminal, seed the real Lagos drain locations (run once):

   ```bash
   npx convex run seed:seedDrains
   ```

4. In a third terminal, start the frontend:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

5. The rainfall and simulated-reading crons (`convex/crons.ts`) run automatically once `npx convex dev` is active, both refreshing every 7 minutes. If you want data immediately instead of waiting, run:

   ```bash
   npx convex run rainfall:refreshRainfallSnapshot
   npx convex run simulate:generateReadings
   ```

## Project Structure

```
app/                     Next.js pages and layout
components/              Dashboard UI (map, table, gauge, charts, alerts)
convex/schema.ts         Database tables
convex/seed.ts           Real Lagos drain locations (run once)
convex/rainfall.ts       Live rainfall fetch (Open-Meteo)
convex/simulate.ts       Simulated sensor reading generator
convex/riskScore.ts      Transparent DIPS risk scoring formula
convex/dashboard.ts      Aggregated query the frontend subscribes to
convex/crons.ts          Scheduled rainfall refresh and reading simulation
```

## Known Limitations (be upfront about these in the pitch)

- Sensor readings are simulated, not live hardware. This is an MVP, not a deployed monitoring network. See "What's Real vs. Simulated" above.
- Drain coordinates are neighborhood-level approximations, not survey-grade positions.
- The risk formula's thresholds (drain capacity, heavy-rain cutoff) are reasonable placeholders, not calibrated against Lagos-specific engineering data.
- No authentication, so anyone can in principle submit a community flood report (`readings:submitCommunityReport`) once that form is wired into the UI. Fine for a public demo, but would need rate limiting or moderation before real-world use.
- The community-report submission form is built on the backend but not yet live in the interface.

## Documents

- `drainguard-explainer.pdf`, `drainguard-explainer.tex`: full technical and plain-language project explainer.
- `drainguard-video-script.md`: script for the project explainer video.
- `wfeo-form-answers.md`: drafted answers for the WFEO ECBAP submission form.

# WOW — Workout of the Week

A zero-maintenance Next.js app that picks the best minimal-equipment, full-body WOD from the previous Monday–Sunday window (America/Chicago), sourced from crossfit.com with a curated evergreen fallback.

## Features
- Scrapes crossfit.com daily (respects robots.txt; links back; only summarized tables shown)
- Filters by Bodyweight-only and No running; jump rope is globally banned
- Movement-by-movement substitutions where known, else family-based fallback
- Hard duration cap: 60 minutes
- Evergreen fallback with banner if fetch/parse fails

## Dev
```bash
npm i
npm run dev
```

## Build
```bash
npm run build && npm start
```

## Deploy
- Push to GitHub, import to Vercel.
- Optional cron (Vercel) to ping `/api/weekly` daily.

## Privacy
- Next.js telemetry is opt-out; to disable locally:
```bash
npx next telemetry disable

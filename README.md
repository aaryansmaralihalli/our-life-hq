# 🌅 Our Life HQ

A private web app for the two of us to track our shared life: bucket list, food
spots, travel (with a real map), gym progress, and health metrics — all done
properly with real formulas.

Built with **React + Vite + Tailwind**, **Supabase** (auth + shared database +
photo storage), **Leaflet** maps, and **Recharts**.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

The app reads Supabase credentials from `.env` (already created). Without them it
falls back to **local mode** (browser localStorage, single device, no login).

## Database setup (once)

In Supabase → **SQL Editor** → paste [`supabase_schema.sql`](supabase_schema.sql)
and **Run**. Then create your two accounts under **Authentication → Users** and
turn off public sign-ups. Full walkthrough in [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

## Deploy

Cloudflare Pages (or Netlify/Vercel): build command `npm run build`, output
directory `dist`. The Supabase anon key is committed in `.env.production` (safe —
it's protected by row-level security), so the hosted build connects automatically.
Client-side routing is handled by `public/_redirects`.

## Project layout

```
src/
  lib/         formulas.js (the science §6), constants.js, db.js, supabase.js, seed.js
  context/     Auth.jsx (login), AppData.jsx (data + CRUD)
  components/  ui.jsx (cards, modals, charts bits), Layout.jsx (nav)
  pages/       Dashboard, BucketList, Food, Travel, Gym, Health, Profile, Login
```

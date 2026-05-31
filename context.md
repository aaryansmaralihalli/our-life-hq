# 🌅 Our Life HQ — Project Context & Build Brief

> A single source of truth for building our shared life-tracking website.
> Hand this whole file to a developer (or to Claude Code) and they should be able to build the app without asking what we want.
> **Last updated:** 31 May 2026

---

## 1. What this is & why we're building it

A private web app for the **two of us (a couple)** to track everything we want to do and become together:

- **Bucket list** of dreams
- **Food** spots to conquer
- **Travel** destinations on a real interactive map
- **Gym** progress with proper strength science
- **Health** metrics (weight, BMI, body fat, etc.) done *properly*

We started in Notion. It's great for databases but it **can't** do three things we care about:
1. A real **map** with our destinations, distance lines between them, and visited places crossed off.
2. **Cascading inputs** (pick Gym → pick muscles → see only those exercises → log sets/reps).
3. **Realistic BMI / body composition** that uses height, age, gender and body fat — not just weight.

A custom site removes every one of those ceilings and lets us style it however we like.

### Non-negotiables
- Must be **free to host**.
- Must work nicely on **phone and laptop**.
- Profile data (height, age, gender, etc.) entered **once**, **editable anytime**.
- All numbers must be **scientifically correct** (formulas in §6).
- Should feel **beautiful and personal**, not like a generic dashboard.

---

## 2. Users & profiles

There are exactly **two profiles** ("Me" and "Partner" — replace with our real names). Everything that's personal (weight, BMI, gym lifts) is tagged to a person. Shared things (bucket list, travel, food) belong to "Both" but can be tagged to one of us.

### One-time onboarding (then editable in Settings)
On first use, each person fills a short profile. Stored permanently; an **Edit profile** button lets us change any field later.

| Field | Type | Used for |
|---|---|---|
| Name | text | labels everywhere |
| Date of birth | date | age (auto-calculated, used in BMR) |
| Gender | male / female | BMR + body-fat formulas differ by sex |
| Height | cm | BMI, BMR, body fat |
| Current weight | kg | starting point for trends |
| Body fat % | number (optional) | if known/measured |
| Neck / waist / hip | cm (optional) | to *estimate* body fat (Navy method) |
| Activity level | sedentary → extra active | TDEE multiplier |
| Goal | lose / maintain / gain | framing of trends |
| Avatar colour or emoji | pick | quick visual identity |

> **Units:** metric throughout (kg, cm, km). Build a units toggle later if we ever want imperial.

---

## 3. The sections (feature spec)

Each section below = a page/tab in the app. Navigation: a persistent sidebar (desktop) / bottom bar (mobile) with: **Home · Bucket List · Food · Travel · Gym · Health · Profile**.

### 3.1 Home / Dashboard
The "ooff, look how far we've come" screen. Big hero metric cards, each tappable to its section:

- 🎯 **Bucket list:** `X of Y dreams done` + % ring.
- 🍜 **Food:** `X of Y spots conquered` + most recent place.
- ✈️ **Travel:** `X of Y destinations visited` + total km of trips done.
- 💪 **Gym:** this month's **total volume (kg)** + each person's **best estimated 1RM** + a "trending up/down" arrow vs last month.
- ⚖️ **Health:** each person's **latest weight, BMI + category** (colour-coded), and change vs first record.
- 📅 **Upcoming:** mini calendar / list of things with a target date (from bucket list + planned trips).

Numbers must be **live** (recompute from data, never hard-coded).

### 3.2 Bucket List
- Add a dream: title, category (Travel / Food / Adventure / Experience / Milestone / Other), who (Both / Me / Partner), status (Idea / Planned / In Progress / Done), target date, excitement (1–3), notes.
- Views: **board by status** (Kanban), **calendar by target date**, and a **list**.
- Metric: completion % and a satisfying "Done" animation when something is ticked off.

### 3.3 Food
- Add a place: name, cuisine, city, status (Want to try / Booked / Conquered), visited-on date, rating (1–5★), cost for two (₹), who, notes.
- **Top metric: `conquered / total`** with a progress bar (this is the headline the user explicitly wanted).
- Filter by cuisine / city / status. Optional: small donut of cuisines.

### 3.4 Travel (the map section)
This is a flagship feature.

- A **real interactive map** (Leaflet + OpenStreetMap — see §7) showing all destinations.
- Marker styles: **Visited = green with a ✓ (crossed off)**, **Planned = solid coral pin**, **Wishlist = hollow/grey pin**.
- **Distance lines** drawn between locations: a polyline connecting the points, with the **great-circle (haversine) distance** labelled on each segment.
- A **"distance from home base" (Chennai)** value for every destination.
- A running **total km** for visited trips and for the planned route.
- Side list of destinations with country, status, budget (₹), trip length; clicking a list item flies the map to it.
- Add a destination: name, country, region, status, **latitude/longitude** (with a "search place" helper that geocodes a name to coordinates — see §7), visited-on, trip length (days), est. budget (₹), who, notes.
- Visited places get a **strikethrough / faded** treatment in the list = "crossed off".

### 3.5 Gym (the cascading logger)
The centrepiece interaction. Logging a workout is a guided, step-by-step flow — **not** one giant form.

**Flow:**
1. **Who?** → toggle Me / Partner.
2. **Date** (defaults to today) + optional session name (e.g. "Push Day").
3. **Which muscle groups?** → multi-select chips: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core, Cardio.
4. **Which exercises?** → the app shows **only exercises belonging to the chosen muscles** (mapping in §6.6). Multi-select; can also type a custom exercise.
5. **For each chosen exercise:** enter sets, reps, weight (kg), and RPE (1–10). *(For Cardio exercises: enter duration + optional distance/calories instead of sets/reps/weight.)*
6. **Session duration** (min) + notes → **Save**.

**On save, auto-compute & store per set/exercise:**
- **Volume (kg)** = sets × reps × weight
- **Estimated 1RM (kg)** = Epley: `weight × (1 + reps/30)`

**Progress views (the "major table" + charts):**
- A **progress table grouped by exercise**, sorted by date, columns: date, who, weight, reps, volume, est. 1RM, RPE — plus a **Δ column** showing change vs the first logged entry (▲ improvement / ▼ regression, colour-coded). This is the scientific progressive-overload table.
- **Personal Records (PRs):** best est. 1RM and best volume per exercise per person, with the date achieved.
- **Charts:** line chart of est. 1RM over time per exercise (one line per person/exercise); bar chart of **weekly total volume**; donut of **training split** (sets per muscle group). These must aggregate *actual numeric values* (which is exactly what Notion couldn't do).
- Filters: by person, by muscle group, by date range.

### 3.6 Health
Proper body-composition tracking, not just a scale number.

- **Log a weigh-in:** date, who, weight (kg). Height/age/gender pulled from profile (no need to re-enter). Optional: body fat %, waist/neck/hip, resting HR, notes.
- **Auto-computed per entry:**
  - **BMI** and **BMI category** using **ICMR 2022 Indian cutoffs** (see §6.1) — colour coded.
  - **BMR** (Mifflin–St Jeor, §6.3) and **TDEE** (§6.4) for calorie awareness.
  - **Body fat %** — use the entered value, or **estimate** via the US-Navy method (§6.5) if waist/neck/(hip) are provided.
- **Reports view:** table per person, latest first; weight, BMI, category, body fat, waist.
- **Trends:** line charts of weight, BMI and body fat over time per person; show the delta since the first record and since 30 days ago.
- Friendly framing tied to each person's **goal** (lose/maintain/gain) — encouraging, never shaming. No calorie/diet *prescriptions*; just show the numbers.

### 3.7 Profile / Settings
- Edit either person's profile (all §2 fields).
- Export all data as JSON (backup); import JSON (restore).
- Switch theme (light/dark) if we build it.
- "Reset section" buttons with confirm.

---

## 4. Cross-cutting behaviours
- **Add / edit / delete** on every item, everywhere. Edits open the same form pre-filled.
- **Empty states** that gently prompt the first entry ("No dreams yet — add your first ✨").
- **Optimistic, instant UI** — saving feels immediate.
- **Confirmation** before delete.
- Mobile-first responsive; thumb-reachable controls.
- Everything **persists** (see §7 data layer) so nothing is lost on refresh.

---

## 5. Seed data (so it doesn't launch empty)
Pre-load the same examples we already put in Notion so the app looks alive on day one:
- **Travel:** Chennai (home, visited), Munnar (visited), Andaman Islands (planned), Reykjavik, Kyoto, Bali (planned), Santorini — with real lat/long.
- **Food:** Murugan Idli Shop, Avartana, Writer's Cafe (conquered); Jay Fai, Sukiyabashi Jiro (want to try); L'Antica da Michele (booked).
- **Gym:** a few weeks of Bench Press / Squat / Deadlift showing rising weights (so the progress chart trends up).
- **Health:** a few weigh-ins per person showing a downward weight trend.
- **Bucket list:** Northern Lights, half marathon, Thai cooking, scuba Andamans, Nandi Hills (done).

---

## 6. The science (exact formulas — implement these verbatim)

### 6.1 BMI + Indian (ICMR 2022) categories
```
BMI = weight_kg / (height_m)^2          // height_m = height_cm / 100
```
Categories (Asian-Indian / ICMR, lower than Western cutoffs because South Asians hit metabolic risk earlier):

| BMI | Category |
|---|---|
| < 18.5 | Underweight |
| 18.5 – 22.9 | Normal |
| 23.0 – 24.9 | Overweight |
| ≥ 25.0 | Obese |

*(Keep WHO cutoffs — 25 / 30 — available as a toggle for reference, but default to ICMR.)*

### 6.2 Estimated 1-Rep Max (strength)
Primary — **Epley (1985)**:
```
e1RM = weight × (1 + reps / 30)
```
Optional cross-check — **Brzycki (1993)**:
```
e1RM = weight × 36 / (37 − reps)
```
Most accurate for **2–10 reps**. Above ~12 reps, flag the estimate as low-confidence.

### 6.3 BMR — Mifflin–St Jeor (most accurate common equation)
```
Men:   BMR = 10·weight_kg + 6.25·height_cm − 5·age + 5
Women: BMR = 10·weight_kg + 6.25·height_cm − 5·age − 161
```

### 6.4 TDEE (calories burned/day)
```
TDEE = BMR × activity factor
```
| Activity | Factor |
|---|---|
| Sedentary (little/no exercise) | 1.2 |
| Lightly active (1–3 days/wk) | 1.375 |
| Moderately active (3–5 days/wk) | 1.55 |
| Very active (6–7 days/wk) | 1.725 |
| Extra active (hard training / physical job) | 1.9 |

### 6.5 Body fat % — US Navy method (used only if measured value not entered)
Measurements in **cm**, `log10` = base-10 log:
```
Men:   %BF = 495 / (1.0324 − 0.19077·log10(waist − neck) + 0.15456·log10(height)) − 450
Women: %BF = 495 / (1.29579 − 0.35004·log10(waist + hip − neck) + 0.22100·log10(height)) − 450
```

### 6.6 Training volume
```
Volume (per set/exercise) = sets × reps × weight
Weekly volume   = sum of volume in the week
Per-muscle volume = sum of volume where exercise maps to that muscle
```

### 6.7 Map distance — Haversine (great-circle)
```
R = 6371 km
dLat = lat2 − lat1 ; dLng = lng2 − lng1   (in radians)
a = sin²(dLat/2) + cos(lat1)·cos(lat2)·sin²(dLng/2)
distance_km = 2 · R · atan2(√a, √(1−a))
```

### 6.8 Muscle → exercise map (for the cascading logger)
```
Chest:      Bench Press, Incline Dumbbell Press, Chest Fly, Push-Up, Cable Crossover, Dips
Back:       Deadlift, Pull-Up, Barbell Row, Lat Pulldown, Seated Cable Row, Face Pull
Shoulders:  Overhead Press, Lateral Raise, Front Raise, Arnold Press, Rear Delt Fly, Upright Row
Biceps:     Barbell Curl, Dumbbell Curl, Hammer Curl, Preacher Curl, Cable Curl
Triceps:    Tricep Pushdown, Skull Crusher, Overhead Extension, Close-Grip Bench, Dips
Quads:      Back Squat, Front Squat, Leg Press, Walking Lunge, Leg Extension, Bulgarian Split Squat
Hamstrings: Romanian Deadlift, Lying Leg Curl, Good Morning, Nordic Curl
Glutes:     Hip Thrust, Glute Bridge, Cable Kickback, Romanian Deadlift
Calves:     Standing Calf Raise, Seated Calf Raise
Core:       Plank, Hanging Leg Raise, Cable Crunch, Russian Twist, Ab Wheel
Cardio:     Treadmill, Cycling, Rowing, Elliptical, Stairmaster, Jump Rope
```
Always allow a free-text "custom exercise" too.

---

## 7. Recommended tech stack

Keep it modern, free, and beginner-friendly to deploy.

| Layer | Choice | Why |
|---|---|---|
| Framework | **React + Vite** | fast, huge ecosystem, easy to host |
| Styling | **Tailwind CSS** | quick, consistent, great for custom design |
| Charts | **Recharts** or **Chart.js** | line/bar/donut for gym & health |
| Map | **Leaflet** + **OpenStreetMap** tiles | free, **no API key, no billing** (Google Maps needs a credit card) |
| Geocoding (name → lat/long) | **Nominatim** (OpenStreetMap) free API | so we can add a place by name |
| Icons | **lucide-react** | clean, free |
| State/data | see data layer below | |

> Plain HTML/CSS/JS also works for a v1 and is even simpler to host, but React+Vite scales better as we add features. Either is fine.

### Data layer — two phases
**Phase 1 (fastest, zero backend): browser `localStorage`.**
- Pros: nothing to set up, totally free, instant.
- Cons: data lives in **one browser on one device** — not synced between our phones.

**Phase 2 (recommended once it works): Supabase (free tier).**
- Free hosted Postgres database + simple auth.
- Lets **both of us log in** and see the **same data on any device**.
- Add later: create a Supabase project → create tables matching §8 → drop in the project URL + anon key as environment variables → swap the localStorage calls for Supabase calls.

---

## 8. Data model (entities & fields)

```
Profile      { id, name, dob, gender, height_cm, weight_kg, bodyFat?, neck?, waist?, hip?,
               activityLevel, goal, colour }

BucketItem   { id, dream, category, who, status, targetDate?, doneDate?, excitement, notes }

FoodSpot     { id, place, cuisine, city, status, visitedOn?, rating?, costForTwo?, who, notes }

Destination  { id, name, country, region, status, lat, lng, visitedOn?, tripDays?,
               budget?, who, notes }

GymEntry     { id, date, who, session?, muscles[], exercise, sets, reps, weight, rpe?,
               duration?, distance?, // cardio
               // computed: volume, e1rm }

HealthEntry  { id, date, who, weight, // height/age/gender from Profile
               bodyFat?, waist?, neck?, hip?, restingHR?, notes,
               // computed: bmi, bmiCategory, bmr, tdee }
```

---

## 9. Hosting — how to get it live for free (step by step)

### Quick comparison (early-2026 free tiers — verify current limits on each pricing page)
| Host | Free bandwidth | Best for | Catch |
|---|---|---|---|
| **Cloudflare Pages** | **Unlimited** | best all-round, fastest CDN | 500 builds/month (plenty) |
| Netlify | ~100 GB/mo | great developer experience, forms | build-minute cap |
| Vercel | ~100 GB/mo | best for Next.js | free tier is **non-commercial** (fine for us) |
| GitHub Pages | ~100 GB/mo (soft) | dead-simple, static only | no serverless, no commercial use |

**Recommendation: Cloudflare Pages** (unlimited bandwidth, simplest Git-based deploy). Netlify or Vercel are equally fine — pick whichever you find friendliest.

### The deploy flow (works for all three)
1. **Put the code on GitHub.**
   - Create a free GitHub account.
   - Create a new repository, e.g. `our-life-hq`.
   - Push the project code to it (`git init`, `git add .`, `git commit -m "first"`, `git push`). If using Claude Code / VS Code, it can do this for you.
2. **Connect the host to GitHub.**
   - Sign up at the host (e.g. dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**).
   - Authorise GitHub and pick the `our-life-hq` repo.
3. **Set the build settings** (for React + Vite):
   - Build command: `npm run build`
   - Output / publish directory: `dist`
   - (Plain HTML site: no build command; publish directory = the folder with `index.html`.)
4. **Deploy.** The host builds and gives you a live URL like `our-life-hq.pages.dev`. Every future `git push` auto-redeploys.
5. **(Optional) Custom domain.** Buy a cheap domain (or use the free `*.pages.dev` URL) and add it in the host's "Custom domains" tab.
6. **(Optional, Phase 2) Add the database.**
   - Create a free Supabase project → copy the **Project URL** and **anon public key**.
   - Add them as environment variables in the host's settings (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Wire the app's data calls to Supabase. Redeploy.

### Keeping it private (just for us)
The site URL is public by default. To keep it ours: add a simple **login** (Supabase Auth, magic-link or email+password) and gate the app behind it. Cloudflare Pages also offers **Access** rules to restrict by email.

---

## 10. Design direction (the look & feel)

**Vibe:** warm, editorial, "shared travel journal meets modern dashboard." Personal, not corporate. The 🌅 sunrise of "Our Life HQ" is the motif.

- **Palette (light, warm):**
  - Background: cream `#FBF6EE` / `#F4EBDD`
  - Ink (text): `#2B2420`
  - Primary accent: terracotta/coral `#C75B39` → `#E07856`
  - Visited/success: sage green `#6B7F6E`
  - Highlight: gold `#D9A441`
  - Sunrise gradient (hero): `#F6C97A → #E07856 → #C75B39`
  - (Build a dark mode later: deep plum/charcoal with the same coral accent.)
- **Typography:** a characterful **display serif** (e.g. *Fraunces* or *Instrument Serif*) for headings, paired with a clean **grotesque** (e.g. *Hanken Grotesk*) for body. **Avoid** Inter/Roboto/Arial.
- **Layout:** generous whitespace, rounded cards (16–20px), soft layered shadows, a subtle paper-grain texture overlay. Sidebar nav on desktop, bottom tab bar on mobile.
- **Metric cards:** big numbers, a small label, a progress ring/bar, a trend arrow. The hero "X of Y conquered" should feel celebratory.
- **Motion:** staggered fade-in on page load; satisfying check-off animation when something's marked done; map markers drop/bounce in; number counters tick up. Keep it tasteful, not noisy.
- **Map:** muted/light tile style so our coral pins and route lines pop.
- **Tone of copy:** warm and encouraging ("You two have crushed 3 of 6 🔥"), first-person-plural, never clinical.
- **Accessibility:** good contrast, keyboard-navigable, readable on small screens, respects reduced-motion.

---

## 11. Build roadmap (suggested order)

1. **Scaffold:** Vite + React + Tailwind project; routing; layout shell (nav + theme).
2. **Profiles & onboarding** + Settings (the data everything depends on).
3. **Data layer** with localStorage + seed data + JSON export/import.
4. **Health** module (BMI/BMR/TDEE/body-fat math + reports + trend charts).
5. **Gym** module (cascading logger → volume/1RM → progress table → charts → PRs).
6. **Travel** module (Leaflet map + markers + distance lines + add-by-name geocoding).
7. **Food** + **Bucket List** modules.
8. **Dashboard** wiring all live metrics together.
9. **Polish:** animations, empty states, mobile pass, dark mode.
10. **Deploy** to Cloudflare Pages (§9).
11. **Phase 2:** add Supabase for login + cross-device sync.

---

## 12. How to actually build this

This file is written so it can be **handed straight to Claude Code** (or any dev). Suggested kickoff:

> "Build the app described in `our-life-hq-context.md`. Start with steps 1–4 of the roadmap (scaffold, profiles, data layer, Health module). Use React + Vite + Tailwind, Recharts, Leaflet, lucide-react. Use the exact formulas in §6. Then we'll deploy to Cloudflare Pages."

Build it section by section, test each, then deploy. Keep this file in the repo as `CONTEXT.md` so the spec lives alongside the code.

---

## 13. Open decisions (things to confirm before/while building)
- Our real names (replace "Me" / "Partner").
- Phase 1 (localStorage, single-device) first, or go straight to Supabase sync?
- Do we want a **login** from day one, or add it later?
- Home base for travel distances = **Chennai** — correct? Any second base?
- Light mode only for v1, or dark mode too?
- Buy a custom domain, or live happily on the free `*.pages.dev` URL?
# 🌅 Our Life HQ — Project Context & Handoff

**The single source of truth for this codebase.** Read this before making changes.
It records what was built, *why* certain decisions were made, the bugs that cost
hours (so they're never repeated), and clear DO / DON'T rules.

> Original product brief is in [`context.md`](context.md). This file is the
> engineering reality on top of it.

_Last updated: 2026-06-01_

---

## 1. What this is

A private web app for a couple (Aaryan + Vibhav) to track their shared life:
**Bucket List, Food, Travel (map), Gym, Health, Profile**, a **Dashboard**, and a
3D **"Our World"** — a Minecraft house you both walk around in together in real
time. Warm editorial design, heavy animation, photo memories.

- **Live:** Cloudflare (Workers/Pages), auto-deploys on every push to `main`.
- **Repo:** `github.com/aaryansmaralihalli/our-life-hq` (private).
- **Backend:** Supabase (auth + Postgres + Storage + Realtime).

---

## 2. Tech stack (and pinned versions — DO NOT bump blindly)

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18.3 + Vite 6 | |
| Styling | Tailwind v4 (`@tailwindcss/vite`) | theme tokens in `src/index.css` |
| Animation | framer-motion 12 | |
| Charts | Recharts 2 | Gym/Health |
| Map | Leaflet + react-leaflet 4 | Travel page |
| 3D | **three 0.169**, @react-three/fiber **8.18**, @react-three/drei **9.122** | R3F 8 because React 18 (R3F 9 needs React 19) |
| Skins | **skinview3d 3.4** + skinview-utils | Minecraft character rendering |
| Backend | @supabase/supabase-js 2 | |
| Host | Cloudflare (`@cloudflare/vite-plugin`, wrangler) | auto-added by CF |

### ⚠️ CRITICAL: the `three` override
`package.json` has:
```json
"overrides": { "three": "$three" }
```
**Never remove this.** skinview3d depends on `three@^0.156`, so npm installs a
**second copy** of three. Two three.js copies = R3F's renderer can't render
skinview3d's `PlayerObject` → **characters render blank** (cost us 3 debugging
rounds). The override forces a single `three` for the whole tree. If you ever
`npm install` and characters go invisible, check for a nested
`node_modules/skinview3d/node_modules/three` first.

---

## 3. Repo layout

```
context.md                 product brief (original)
PROJECT_CONTEXT.md         THIS FILE
README.md                  short run/deploy notes
SUPABASE_SETUP.md          DB + auth + storage setup steps
supabase_schema.sql        run once in Supabase SQL editor
GET_WORLD_MODEL.md         how the 3D model was sourced (history)
vite.config.js             ⚠️ has assetsInclude + assetsInlineLimit:0 (see §6)
.env / .env.production     Supabase keys (anon key is safe to commit)

src/
  main.jsx, App.jsx        routing (World is lazy-loaded)
  index.css                Tailwind theme + aurora/glass/portal CSS
  context/
    Auth.jsx               Supabase auth; exposes { email, authed, cloud, ... }
    AppData.jsx            loads all tables, CRUD helpers, seed-on-first-run
  lib/
    supabase.js            client + SUPABASE_READY flag
    db.js                  backend-agnostic CRUD (Supabase OR localStorage)
    formulas.js            the §6 science (BMI/BMR/TDEE/1RM/haversine/bodyfat)
    constants.js           statuses, muscle→exercise map, HOME_BASE, etc.
    seed.js                sample data
    photos.js              upload/resolve photos (Supabase Storage or data URL)
  components/
    Layout.jsx             aurora bg + animated Dock + page transitions
    Dock.jsx               macOS-style magnifying nav dock
    ui.jsx                 Card/Button/Modal/StatusPicker/Ring/confetti/etc.
    motion.jsx             AnimatedNumber, TiltCard, Reveal, variants
    PhotoUploader.jsx, PhotoStrip.jsx
  pages/
    Dashboard, BucketList, Food, Travel, Gym, Health, Profile, Login
    World.jsx              /world: portals to document.body, mounts Scene3D
  world/
    Scene3D.jsx            ⭐ the 3D scene (house + characters + controls + net)
    Joystick.jsx           mobile touch joystick + up/down fly buttons
    usePresence.js         Supabase Realtime broadcast (co-presence)
    Portal.jsx             Nether-portal photo gallery overlay
    WorldBoundary.jsx      error boundary so /world never blanks silently
    Character.jsx          ⚠️ UNUSED (old composite approach; safe to delete)
    assets/
      skin-her.png, skin-him.png   64x64 Minecraft skins
      world3d/house.glb            the floating house (Draco, ~3MB)
```

---

## 4. Data layer & backends

- **Two backends, one API** (`src/lib/db.js`): if Supabase env vars are present →
  cloud (shared, synced); else → `localStorage` (single-device fallback). All
  pages call `useData()` from `AppData.jsx`; never call Supabase directly from a
  page.
- **Tables** (snake_case, mirror localStorage keys): `profiles`, `bucket_items`,
  `food_spots`, `destinations`, `gym_entries`, `health_entries`. Schema +
  row-level security in [`supabase_schema.sql`](supabase_schema.sql).
- **Photos:** stored in Supabase Storage bucket `photos` (private; signed URLs)
  in cloud mode, or inline base64 in local mode. Downscaled client-side.
- **Auth:** email + password, 2 accounts, public signups disabled. The anon key
  is *meant* to be public (protected by RLS) — safe to commit.

---

## 5. The 3D World (`/world`) — how it actually works

This took many iterations. Architecture as it stands:

- **`World.jsx`** renders via `createPortal(..., document.body)` — it must escape
  `Layout`'s page-transition wrapper, whose CSS `filter: blur` creates a
  containing block that traps `position: fixed`. (Don't move the scene back
  inside Layout's `<main>`.)
- **`Scene3D.jsx`** is one R3F `<Canvas>` containing:
  - **`WorldModel`** — loads `house.glb` via drei `useGLTF`, auto-centers +
    auto-scales it (idempotent — see §6), raycasts down to find the floor.
  - **`Character3D`** (×2) — skinview3d `PlayerObject` dropped in via
    `<primitive>`. One is locally controlled, the other follows the network or
    idles.
  - **`MovementController`** — grid-stepped WASD/arrows + Space/Shift, joystick,
    camera-relative.
  - **`FollowCamera`** — camera tracks the controlled character; OrbitControls
    still allows trackpad orbit/zoom-to-cursor/pan on top.
  - **`usePresence`** — Supabase Realtime broadcast channel `our-world`.
- **Per-user control** (in `World.jsx`): `BOY_EMAIL` / `GIRL_EMAIL` constants
  map login → which character you drive. **`GIRL_EMAIL` is a PLACEHOLDER**
  (`vibhavgangolli@gmail.com`) — update it to Vibhav's real Supabase login.
- **Co-presence:** each client broadcasts its character's position (~12/sec, and
  ONLY when it changed — see §6 efficiency), partner's browser moves the other
  character to match. TCP/WebSocket under the hood (browsers can't do UDP).

### Tunable constants at the top of `Scene3D.jsx`
`WORLD_SPAN`, `CHAR_SCALE`, `CHAR_GAP`, `CHAR_FORWARD`, `FLOOR_FRACTION`,
`GROUND_OFFSET`, `STEP`, `STEP_COOLDOWN`, `MOVE_LERP`. Tune these for
placement/feel — they're intentionally surfaced.

---

## 6. ☠️ Bugs that cost hours — DO NOT reintroduce

These are the expensive lessons. Each is a real fix that's load-bearing.

1. **Duplicate three.js → blank characters.** Fixed by `overrides.three` (§2).
   Don't remove it.

2. **Vite inlines small assets → prod-only breakage.** Skins are <4KB; Vite
   inlined them as base64 data URLs in prod (but served files in dev), and
   skinview-utils `loadImage`/`inferModelType` misbehaved on data URLs →
   **characters invisible in prod only**. Fixed with `assetsInlineLimit: 0` in
   `vite.config.js`. **Keep it.** Also `assetsInclude: ["**/*.glb"]` is required
   for `.glb` imports.

3. **Animated mesh frustum culling.** three computes a mesh's bounding box at
   rest; skinview3d animates limbs outside it → three culls them → characters
   "flash then vanish." Fixed by setting `frustumCulled = false` on character
   meshes **every frame** (skinview3d rebuilds meshes on skin load, so once
   isn't enough).

4. **Transparent skin materials flicker.** skinview3d skin layers are
   `transparent: true`; they re-sort per frame and drop behind the world. Fixed
   by forcing skin meshes `transparent:false; alphaTest:0.5; depthWrite:true`.

5. **The "invisible house."** The house glb material is `alphaMode: MASK`; its
   alpha channel clipped EVERY pixel → whole house invisible (but geometry
   loaded, raycast hit it). Fixed by `alphaTest = 0; transparent = false` on the
   house materials. (Unlit MeshBasic "worked" only because it skipped alpha.)
   Keep the alphaTest=0 fix in `WorldModel`.

6. **`EXT_texture_webp` required → model won't render.** When gltf-transform
   compresses textures to webp, it marks webp as a *required* extension; if the
   loader can't decode it three refuses the whole model. **When compressing glb,
   use `--compress draco --texture-compress false`** (Draco geometry only, keep
   PNG textures). Don't use `--texture-compress webp`.

7. **Non-deterministic placement (React StrictMode).** StrictMode double-invokes
   effects. The world-scaling effect scaled an already-scaled scene the 2nd run
   → different ground height each reload → characters randomly underground. Fixed
   by making the scale/measure **idempotent** (reset transform to 1 before
   measuring). Any measure-then-mutate effect here MUST be idempotent.

8. **Character foot height measured mid-animation.** Measuring the player's
   bbox after the idle animation started gave a different lift each load. Measure
   at rest pose, before animations run.

9. **Camera fight / race.** Two things controlled the camera (a manual `lookAt`
   and OrbitControls' `target`) → intermittent "characters off-screen." Make
   OrbitControls the single source of truth: set `controls.target` +
   `controls.update()`, don't also call `camera.lookAt` separately.

10. **Idle broadcast waste.** Realtime sent ~12 msgs/sec even while standing
    still. Fixed: only broadcast when position actually changed (§ commit
    4f25394). Keep this — it's what keeps Supabase Realtime usage near zero.

---

## 7. Free-tier safety (verified)

- **Cloudflare:** unlimited bandwidth; only limit is 500 builds/mo (we use ~1 per
  push). Will not exhaust.
- **Supabase data/storage:** tiny usage, nowhere near 500MB DB / 1GB storage.
- **Supabase Realtime:** ~2M msgs/mo free. With the "only-when-moving" fix, idle
  tabs cost nothing; only active both-players movement consumes. Fine for normal
  use. No card on file anywhere → worst case is a pause, never a bill.

When optimizing the glb, keep it lean (current house ~3MB). Don't commit the
raw 16–40MB source models — they live in the untracked `character pics and vid/`
folder, NOT in git.

---

## 8. DO / DON'T

**DO**
- Keep `overrides.three`, `assetsInlineLimit: 0`, `assetsInclude` glb.
- Test the **production build locally** (`npm run build` + `npx vite preview`)
  before trusting prod — several bugs were prod-only.
- Hard-refresh (Cmd+Shift+R) after every rebuild — chunk hashes change and stale
  tabs 404 → look "blank."
- Compress new glb with `--compress draco --texture-compress false`.
- Keep tunables at the top of `Scene3D.jsx`; adjust those rather than scattering
  magic numbers.
- Update `GIRL_EMAIL` in `World.jsx` to Vibhav's real login.

**DON'T**
- Don't bump three/R3F/drei to versions needing React 19 (we're on React 18).
- Don't make `/world` render inside `Layout`'s `<main>` (fixed-position trap).
- Don't re-enable webp texture compression on the glb.
- Don't commit `.env`, the `character pics and vid/` source folder, or raw
  multi-MB models.
- Don't add per-frame `console.log` or remove the `WorldBoundary`.
- Don't reintroduce any of the §6 bugs.

---

## 9. Known follow-ups / not done yet

- **Collision (Phase B):** characters currently fly/walk through walls & floors.
  Real floor/wall collision (raycast or physics) is a deliberate follow-up.
- **Two-player co-presence is UNTESTED by the dev** (needs two logins) — wired
  per Supabase's broadcast API but the real test is Aaryan + Vibhav together.
- **Vibhav's real email** still a placeholder.
- **Position persistence / Supabase Presence** (resume where you left off, show
  who's online) — not built; natural next step if wanted.
- **`src/world/Character.jsx`** is unused (old composite approach) — safe to
  delete.
- **Gaussian-splat environment** — discussed as a possible future "real place"
  capture; research spike only, not started.

---

## 10. Run / deploy

```bash
npm install            # respects the three override
npm run dev            # http://localhost:5173
npm run build          # production build → dist/
npx vite preview       # serve the prod build locally (use this to catch prod bugs)
```
Push to `main` → Cloudflare auto-builds & deploys. Confirm the deployment commit
hash + "Success" in the Cloudflare dashboard, then hard-refresh the live URL.

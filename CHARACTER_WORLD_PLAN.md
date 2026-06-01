# 🎮 Character World — Technical Plan

A planning doc for the "Minecraft couple + Nether-portal memory gallery" idea.
**Status: not built yet — this is the blueprint to decide from.**

## The vision (grounded in your assets)
Your generated assets are a **Minecraft-style voxel couple** (the two of you). The
**Nether portal** is perfectly on-theme (it's a Minecraft thing). So the "world"
is a small Minecraft-ish diorama where your character(s) idle, and objects in the
scene are doors into your real data:

```
            ☁     ☁
         [ Minecraft couple ]      ← idle: breathe, look around, occasionally wave
                  |
   "Hey… remember this?"  💬        ← speech bubble after a few seconds idle
                  |
            [ floating VHS tape ]   ← clickable object
                  | click
        ╔══════════════════════╗
        ║   N E T H E R        ║    ← purple portal swirl opens behind them
        ║   ▓▓ portal ▓▓       ║
        ║   your photos float  ║    ← real photos from Supabase, drifting inside
        ╚══════════════════════╝
```

Other objects = other sections (reusing the app we already built):
- 📼 VHS tape → **photo memories** (Bucket/Food/Travel photos)
- 🗺️ map block → **Travel**
- 🍖 food item → **Food**
- 💪 dumbbell → **Gym**
- 📖 book → **Bucket list**

## Why this is *more* achievable than a generic 3D app
Minecraft characters are **literally boxes** — no expensive rigging or sculpting.
A voxel avatar is ~6 cuboids (head, body, 2 arms, 2 legs) with a skin texture.
This is the cheapest possible "3D character," and the portal is a shader on a plane.

---

## Recommended stack (all free / open source)
| Layer | Choice | Notes |
|---|---|---|
| 3D engine | **three.js** | the renderer |
| React glue | **@react-three/fiber** | three.js as React components |
| Helpers | **@react-three/drei** | camera controls, loaders, `<Html>`, shaders |
| Postprocessing | **@react-three/postprocessing** | bloom/glow for the portal |
| Character | **a Minecraft skin renderer** (e.g. `skinview3d`) OR a hand-built voxel rig in R3F using your skin PNG | reuses your existing skin art |
| Animation | simple keyframed idle/wave in code (no Mixamo needed for blocky limbs) | Mixamo is overkill for Minecraft rigs |
| Portal FX | custom GLSL shader on a circle + particles + bloom | the "wow" moment |
| AI "brain" (optional, later) | a tiny rules engine first; Claude API only if you want real dialogue | start dumb, add smarts later |

> We already use React + Vite, so R3F drops straight in. No framework change.

## How it reuses what we built
- **Photos** already upload to Supabase Storage (`photos` bucket, signed URLs).
  The portal gallery just calls the same `photoUrl()` helper and maps each photo
  onto a plane floating inside the portal. **Zero new backend.**
- **All section data** (bucket/food/travel/gym/health) already loads via
  `AppData` context — the 3D objects link to the same routes/data.
- Auth, sync, deploy pipeline: unchanged.

---

## Build milestones (each independently shippable)
**M1 — Scene skeleton (½–1 day).** New route `/world`. R3F canvas, warm sky,
ground plane, camera, lighting. Dashboard stays the default; `/world` is opt-in.

**M2 — The character (1–2 days).** Render the Minecraft couple from your skin
PNG (voxel rig or skinview3d). Idle animation: subtle bob + head turn + periodic
wave. This is the heart of "feels alive vs. pop-up ad."

**M3 — Idle dialogue (½ day).** After N seconds idle, a speech bubble (`<Html>`
from drei) shows "Hey… remember this?" and a floating VHS tape fades in. Rules-
based, no AI yet.

**M4 — The Nether portal (2–3 days).** Click the tape → portal shader swirls open
behind the character with bloom + purple particles. The signature moment.

**M5 — Photos inside (1 day).** Pull real photos from Supabase, float them inside
the portal on planes; click one → lightbox. Drift/parallax motion.

**M6 — More objects (ongoing).** Map/food/dumbbell/book objects → existing
sections. Optional **M7**: Claude-API dialogue so the character actually comments
on your memories.

**Rough total for the magic demo (M1–M5): ~1 week of focused work.**

---

## Honest trade-offs / risks
- **It's a second product**, not a tweak. It largely *replaces* the dashboard UX
  as the "front door." Keeping both (`/` dashboard, `/world` experience) is wise.
- **Heavier page**: WebGL + models. Fine on laptops & modern phones; we'll lazy-
  load `/world` so the dashboard stays light.
- **"Alive, not annoying"** is the real design challenge (your own words). Budget
  iteration time on idle timing, motion easing, and not over-talking.
- **Mobile**: 3D + touch needs care; doable, needs testing.
- **AI dialogue** (M7) introduces an API key + cost; start without it.

## Decision points for you
1. **One character or both of you** in the scene? (Assets show both.)
2. **Replace** the dashboard as the home screen, or live alongside at `/world`?
3. **Start at M1 now**, or wait? (This doc covers the "research/plan it" choice.)
4. AI dialogue in scope eventually, or keep it scripted/rules-based?

## Assets on hand (local only, not committed)
`character pics and vid/` — 2 voxel-couple renders (PNG) + an 8s 720×1280 mp4.
Kept on your disk, gitignored (too heavy for the site repo). If we build the
world, the **skin texture** is what we need; the renders are style reference.

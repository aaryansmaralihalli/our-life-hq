# 🌄 Making "Our World" Look Realistic — Research + Plan

**Current live state (good):** `/world` = a full-screen **photo** of a Minecraft
shader world + your two real **skinview3d** characters (turning, with skins) +
VHS-tape → portal flow. We rolled back here after the live-voxel attempt broke.

This doc captures what I learned and the real options for a *beautiful* world.

---

## Why the DIY voxel build failed
My hand-built voxel world (commit 8b0c880) had two bugs:
1. **Characters had no skin** — reusing skinview3d's `PlayerObject` outside its
   own `SkinViewer` is a known trap: the skin texture needs the right
   **colorSpace (sRGB)** + material update + correct **UV/modelType**, or it
   renders blank. ([skinview3d](https://github.com/bs-community/skinview3d),
   [three.js voxel geometry](https://threejs.org/manual/en/voxel-geometry.html))
2. **They didn't turn** — my rotation writes fought the animation `update()` and
   the camera framing. Fixable, but it confirmed: hand-rolling both a voxel world
   *and* character integration from scratch is fiddly and not worth it when better
   paths exist.

Hand-painting blocks also never looks as good as **real Minecraft texture packs**.

---

## The realistic options (ranked)

### ⭐ Option 1 — Real Minecraft world exported to 3D (Mineways → glTF)
The proven, best-looking path. ([minecraft3Dwebapp](https://github.com/LucaMueller1/minecraft3Dwebapp),
[Mineways docs](https://www.realtimerendering.com/erich/minecraft/public/mineways/mineways.html),
[Minecraft Wiki 3D exporters](https://minecraft.fandom.com/wiki/Tutorials/Programs_and_editors/3D_exporters))

**Workflow:**
1. Build (or download) a nice scene in actual Minecraft — or use a pre-made one.
2. **Mineways** exports a selected region → `.obj` (+ textures), or directly to a
   3D format. Apply a **texture pack** at export so the look is baked in.
3. Convert to **`.glb`** (binary glTF) — via Blender or Mineways directly.
4. Load with three.js **`GLTFLoader`** → drop characters in the same scene.

- ✅ **Looks like a real, gorgeous Minecraft world** — actual geometry, real
  texture-pack art, depth, you can orbit/pan.
- ✅ Supports **PBR texture packs** (normal maps, parallax) → near-photoreal.
- ⚠️ Needs a one-time **asset-prep step outside the browser** (Mineways/Blender),
  and the `.glb` can be a few MB (we'd optimize/Draco-compress).
- ⏱️ Most setup, best payoff.

### Texture packs — yes, these exist and are the key to realism
- **Realism Mats** — Ultra-HD **PBR** packs (64×–1024×) with normal maps +
  parallax occlusion, built for shaders/realism. ([realismmats.com](https://www.realismmats.com/landing-page/))
- **jmc2obj** exports with **PBR resource-pack support**, producing full PBR
  materials in three.js. ([Casey Primozic's notes](https://cprimozic.net/notes/posts/exporting-minecraft-objects-to-threejs/))
- Classic painterly/faithful packs work too; three.js even ships a
  [Minecraft demo with the painterly pack](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_geometry_minecraft.html).

### Option 2 — Upgrade the photo background (cheap, looks great now)
Keep the current flat-image approach but make it richer:
- Use a **higher-quality shader screenshot** (or a few, day/night, that
  cross-fade), add subtle **parallax** (image shifts slightly with the cursor),
  drifting clouds, particles. Characters stay as skinview3d (which already works).
- ✅ Low risk, fast, already-good base. ❌ Still 2D — no true depth/walk-in.

### Option 3 — Retry the live voxel world, done right
Same idea as the broken build, but fix the two bugs properly:
- Render characters with a **correctly-configured** standalone skin mesh
  (sRGB texture, proper material), OR keep them as skinview3d canvases composited
  in front of an R3F voxel world.
- Use **real texture-pack tiles** instead of my hand-painted ones.
- ✅ Fully procedural/in-browser, no external tools. ⚠️ Most engineering risk;
  still won't match a real exported world's fidelity.

---

## My recommendation
- **Want true realism / "real Minecraft world"** → **Option 1** (Mineways + a PBR
  texture pack → glTF). It's the only path that genuinely looks like Minecraft
  with shaders. Needs you (or me, guided) to do a one-time export.
- **Want a quick visible upgrade with zero asset tooling** → **Option 2**
  (better image + parallax + clouds). I can do this entirely in code today.

## What I'd need from you per option
- **Option 1:** either (a) a `.glb`/`.obj` export of a Minecraft scene with a
  texture pack applied, or (b) confirmation you want me to give you exact
  Mineways + texture-pack steps to produce one, then drop it in `src/world/assets/`.
- **Option 2:** one or more high-res Minecraft shader screenshots (you already
  made a great one); I'll add parallax/clouds/day-night in code.

## Open question
Do you want the world to be **explorable/orbitable** (true 3D, Option 1/3) or is a
**beautiful living backdrop** (Option 2) enough for the "memory portal" experience?

# 📦 Get the 3D Minecraft world model (.glb) — your one step

We're building Option 1: a real 3D Minecraft world you can orbit, with the two of
you standing inside it. **I can't create or download the world model for you** —
3D model files have to come from a download or an export tool I can't run. So this
is the one thing I need from you. Everything after this, I build.

The live site stays on the current working version until you drop the file in.

---

## What to download
A **Minecraft world / landscape** as a **`.glb`** (or `.gltf`) file — ideally
already textured, free to use.

### Where (fastest: Sketchfab)
1. Go to **https://sketchfab.com** and search e.g.
   **"minecraft world"**, **"minecraft island"**, **"minecraft landscape"**.
2. Filter: tick **Downloadable** (and optionally **Free**). Look for ones with a
   permissive license (CC0 / CC-BY).
3. Pick one you like → **Download 3D Model** → choose the **glTF (.glb)** format
   (Sketchfab offers "Autoconverted GLB" — that's perfect).
   - Tip: prefer models **under ~15 MB** so the page loads fast. If it's huge,
     that's okay — I'll compress it (Draco) after.

### Other sources (also fine)
- **Poly Pizza** (https://poly.pizza) — search "minecraft", lots of free CC0 `.glb`.
- **CGTrader / TurboSquid** — filter Free + Format glTF.

> If you'd rather build/export your *own* Minecraft scene later, the tool is
> **Mineways** (export region → glTF, apply a texture pack like **Realism Mats**
> for PBR realism). Ask me and I'll give exact steps. But for now, a Sketchfab
> download gets us moving immediately.

---

## Where to put it
Drop the file here and name it **`world.glb`**:

```
src/world/assets/world3d/world.glb
```

(There's a placeholder `PUT_GLB_HERE.txt` in that folder so you can find it.)

Then tell me **"world.glb is in"** and I'll immediately:
1. Load it with three.js `GLTFLoader` into a real 3D scene (orbit/pan camera).
2. Place both of you **inside** it as true 3D characters — fixing the two bugs
   that broke the voxel build (skin texture needs **sRGB colorspace**; rotation
   must not fight the animation loop).
3. Light it (golden-hour sun + sky + fog), keep the VHS-tape → portal → photos.
4. We test together and I tune camera angle + character scale against the real
   model.

---

## Quick checklist before you send it
- [ ] File ends in **`.glb`** (or `.gltf` + its textures).
- [ ] It's a **world/landscape**, not a single character or item.
- [ ] Free / permissive license (so we can host it).
- [ ] Renamed to **`world.glb`**, placed in `src/world/assets/world3d/`.

Not sure if a model is right? Drop it in anyway and I'll inspect it (size,
textures, scale) before wiring — same as I did with your skins.

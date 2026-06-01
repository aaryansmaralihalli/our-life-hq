// Hand-authored 64x64 Minecraft skin textures, painted on a canvas, returned
// as data URLs. Two "lookalike" skins approximating the generated renders:
//   - her:  dark hair, red dress, light skin
//   - him:  brown hair, blue shirt, dark trousers, white shoes
//
// Minecraft 64x64 skin UV atlas (the regions skinview3d reads):
//   HEAD:  top row. faces at (8,8) front. We fill the whole head block area.
//   BODY:  front face at (20,20) 8x12
//   R-ARM: front at (44,20) 4x12      L-ARM: front at (36,52) 4x12
//   R-LEG: front at (4,20) 4x12       L-LEG: front at (20,52) 4x12
// We paint each cuboid's 6 faces as solid blocks so the whole model is covered;
// exact face precision isn't needed for a stylised companion.

const SKIN = 64;

// helper: fill a rectangle with a color
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// scatter a few darker pixels for simple shading/texture
function speckle(ctx, x, y, w, h, color, density = 0.12) {
  ctx.fillStyle = color;
  for (let i = 0; i < w * h * density; i++) {
    const px = x + ((Math.random() * w) | 0);
    const py = y + ((Math.random() * h) | 0);
    ctx.fillRect(px, py, 1, 1);
  }
}

/* Paint one cuboid's full 6-face region given the atlas origin (ox,oy),
   dimensions in "pixels" w(width) h(height) d(depth), with a base color.
   Layout per MC spec:  [top|bottom] across, then [right|front|left|back] row. */
function cuboid(ctx, ox, oy, w, h, d, color, shade) {
  // top & bottom strip
  rect(ctx, ox + d, oy, w, d, shade); // top
  rect(ctx, ox + d + w, oy, w, d, shade); // bottom
  // sides row (right, front, left, back)
  rect(ctx, ox, oy + d, d, h, shade); // right
  rect(ctx, ox + d, oy + d, w, h, color); // front
  rect(ctx, ox + d + w, oy + d, d, h, shade); // left
  rect(ctx, ox + d + w + d, oy + d, w, h, color); // back
}

function paint(opts) {
  const c = document.createElement("canvas");
  c.width = SKIN;
  c.height = SKIN;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // transparent base
  ctx.clearRect(0, 0, SKIN, SKIN);

  const { skin, skinShade, hair, hairShade, top, topShade, legs, legShade, shoes } = opts;

  // ---- HEAD (8x8x8) at origin (0,0) ----
  cuboid(ctx, 0, 0, 8, 8, 8, skin, skinShade);
  // hair: overpaint top, back, sides, and a fringe on the front-top
  rect(ctx, 8, 0, 8, 8, hairShade); // top of head = hair
  rect(ctx, 24, 0, 8, 8, hairShade); // bottom (keep)
  rect(ctx, 0, 8, 8, 8, hair); // right side hair
  rect(ctx, 16, 8, 8, 8, hair); // left side hair
  rect(ctx, 24, 8, 8, 8, hair); // back of head hair
  rect(ctx, 8, 8, 8, 2, hair); // front fringe
  // face details on the front (8,8)..(16,16)
  rect(ctx, 10, 11, 1, 1, "#3a2b1f"); // L eye
  rect(ctx, 13, 11, 1, 1, "#3a2b1f"); // R eye
  rect(ctx, 11, 13, 2, 1, "#b3705a"); // mouth
  speckle(ctx, 8, 8, 8, 8, skinShade, 0.05);

  // ---- BODY (8x12x4) at (16,16) ----
  cuboid(ctx, 16, 16, 8, 12, 4, top, topShade);
  speckle(ctx, 20, 20, 8, 12, topShade, 0.1);

  // ---- RIGHT ARM (4x12x4) at (40,16) ----
  cuboid(ctx, 40, 16, 4, 12, 4, top, topShade); // sleeve
  rect(ctx, 44, 32 - 0, 0, 0, top); // noop guard
  // hands (skin) at bottom of arm front/back
  rect(ctx, 44, 32 - 4, 4, 4, skin);

  // ---- LEFT ARM (4x12x4) at (32,48) ----
  cuboid(ctx, 32, 48, 4, 12, 4, top, topShade);
  rect(ctx, 36, 48 + 12 + 4 - 4, 4, 4, skin);

  // ---- RIGHT LEG (4x12x4) at (0,16) ----
  cuboid(ctx, 0, 16, 4, 12, 4, legs, legShade);
  rect(ctx, 4, 16 + 4, 4, 4, shoes); // shoe-ish foot front near bottom is handled below
  // shoes: bottom 3px of the leg front/back
  rect(ctx, 4, 16 + 4 + 12 - 3, 4, 3, shoes); // front bottom
  rect(ctx, 12, 16 + 4 + 12 - 3, 4, 3, shoes); // back bottom

  // ---- LEFT LEG (4x12x4) at (16,48) ----
  cuboid(ctx, 16, 48, 4, 12, 4, legs, legShade);
  rect(ctx, 20, 48 + 4 + 12 - 3, 4, 3, shoes);
  rect(ctx, 28, 48 + 4 + 12 - 3, 4, 3, shoes);

  return c.toDataURL("image/png");
}

// Her: dark hair, red dress, light skin, black skirt/legs, dark shoes
export function makeHerSkin() {
  return paint({
    skin: "#e9b596",
    skinShade: "#d49e80",
    hair: "#241c24",
    hairShade: "#171117",
    top: "#c0392b", // red dress top
    topShade: "#9c2b20",
    legs: "#1c1c22", // black skirt/legs
    legShade: "#121216",
    shoes: "#0e0e10",
  });
}

// Him: brown hair, blue shirt, dark trousers, white shoes
export function makeHimSkin() {
  return paint({
    skin: "#e7b18c",
    skinShade: "#cf9873",
    hair: "#3a2415",
    hairShade: "#271810",
    top: "#2f6fb0", // blue shirt
    topShade: "#235488",
    legs: "#20242c", // dark trousers
    legShade: "#161a20",
    shoes: "#f2f2f2", // white shoes
  });
}

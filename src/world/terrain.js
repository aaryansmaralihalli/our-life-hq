// Generate a small voxel landscape: a heightmap with grass/dirt/stone, a water
// pool, sand shores, and a few trees. Returns block lists grouped by type so
// each type can be rendered as one InstancedMesh (fast).

// deterministic pseudo-random so the world is stable across reloads
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// smooth value noise from a coarse random grid
function makeNoise(rand, gw, gh) {
  const grid = [];
  for (let j = 0; j <= gh; j++) {
    grid[j] = [];
    for (let i = 0; i <= gw; i++) grid[j][i] = rand();
  }
  const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  return (x, z) => {
    const gx = (x / 6) % gw;
    const gz = (z / 6) % gh;
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const tx = gx - x0;
    const tz = gz - z0;
    const a = lerp(grid[z0][x0], grid[z0][x0 + 1], tx);
    const b = lerp(grid[z0 + 1][x0], grid[z0 + 1][x0 + 1], tx);
    return lerp(a, b, tz);
  };
}

export function generateTerrain({ size = 28, seed = 1313 } = {}) {
  const rand = mulberry32(seed);
  const noise = makeNoise(rand, 6, 6);

  const half = size / 2;
  const waterLevel = 1;

  const blocks = { grass: [], dirt: [], stone: [], sand: [], water: [], log: [], leaves: [] };
  const heightAt = {}; // "x,z" -> top y (for placing characters/trees)

  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      // height 0..4
      const n = noise(x + half, z + half);
      let h = Math.floor(n * 4); // 0..3
      // carve a gentle lake in one quadrant
      const lake = x > 2 && z > 2 && noise((x + half) * 1.3, (z + half) * 1.3) < 0.4;
      if (lake) h = 0;

      heightAt[`${x},${z}`] = h;

      // column: stone base, dirt, grass/sand top
      for (let y = 0; y <= h; y++) {
        if (y === h) {
          if (lake || h <= waterLevel) blocks.sand.push([x, y, z]);
          else blocks.grass.push([x, y, z]);
        } else if (y >= h - 1) {
          blocks.dirt.push([x, y, z]);
        } else {
          blocks.stone.push([x, y, z]);
        }
      }
      // water fills low areas up to waterLevel
      if (h < waterLevel) {
        for (let y = h + 1; y <= waterLevel; y++) blocks.water.push([x, y, z]);
      }
    }
  }

  // scatter a few trees on grass, away from center (where characters stand)
  const treeCount = 7;
  let placed = 0;
  let attempts = 0;
  while (placed < treeCount && attempts < 200) {
    attempts++;
    const x = Math.floor(rand() * size) - half;
    const z = Math.floor(rand() * size) - half;
    const key = `${x},${z}`;
    const h = heightAt[key];
    if (h == null) continue;
    if (Math.abs(x) < 4 && z > -2 && z < 4) continue; // keep the stage clear
    const isGrass = blocks.grass.some(([bx, by, bz]) => bx === x && bz === z && by === h);
    if (!isGrass) continue;

    const trunkH = 3 + (rand() < 0.5 ? 1 : 0);
    for (let i = 1; i <= trunkH; i++) blocks.log.push([x, h + i, z]);
    const topY = h + trunkH;
    // leaf canopy
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++)
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
          blocks.leaves.push([x + dx, topY + dy, z + dz]);
        }
    placed++;
  }

  // find a flat-ish stand point near center front for the couple
  const standY = (heightAt["0,0"] ?? 0) + 1;

  return { blocks, heightAt, standY, size };
}

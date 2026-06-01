import * as THREE from "three";

/* Procedurally paint 16x16 Minecraft-style block textures on a canvas and
   return THREE.Textures. No external texture-pack files needed. Each block
   type returns an array of 6 materials [+x,-x,+y,-y,+z,-z] so tops/sides/bottoms
   can differ (e.g. grass). */

const S = 16;

function noiseTile(base, spots, density = 0.35) {
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < S * S * density; i++) {
    ctx.fillStyle = spots[(Math.random() * spots.length) | 0];
    ctx.fillRect((Math.random() * S) | 0, (Math.random() * S) | 0, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function grassTop() {
  return noiseTile("#5fa544", ["#6cb34e", "#54993c", "#79c25a", "#4f8f38"]);
}
function dirt() {
  return noiseTile("#7a5a3a", ["#6b4d30", "#876647", "#5f4429"]);
}
function grassSide() {
  // dirt with a green strip on top
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  // dirt base
  ctx.fillStyle = "#7a5a3a";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < S * S * 0.3; i++) {
    ctx.fillStyle = ["#6b4d30", "#876647", "#5f4429"][(Math.random() * 3) | 0];
    ctx.fillRect((Math.random() * S) | 0, (Math.random() * S) | 0, 1, 1);
  }
  // grass top strip
  ctx.fillStyle = "#5fa544";
  ctx.fillRect(0, 0, S, 4);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = ["#6cb34e", "#54993c", "#79c25a"][(Math.random() * 3) | 0];
    ctx.fillRect((Math.random() * S) | 0, (Math.random() * 5) | 0, 1, 1);
  }
  // a few green drips
  for (let x = 0; x < S; x++) {
    if (Math.random() < 0.4) ctx.fillRect(x, 4, 1, 1 + ((Math.random() * 2) | 0));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}
function stone() {
  return noiseTile("#8a8a8a", ["#7d7d7d", "#979797", "#6f6f6f"]);
}
function sand() {
  return noiseTile("#e3d9a8", ["#d9ce99", "#ece2b4", "#cfc389"]);
}
function log() {
  return noiseTile("#6e5235", ["#5e4529", "#7d5f3f"]);
}
function leaves() {
  return noiseTile("#3f7d34", ["#356b2c", "#4a8f3d", "#2f5f26"], 0.5);
}
function water() {
  const t = noiseTile("#3a6fd8", ["#3866c8", "#4279e6"], 0.2);
  return t;
}

function mat(tex, opts = {}) {
  return new THREE.MeshLambertMaterial({ map: tex, ...opts });
}

/* Build a cache of 6-face material arrays per block type. */
export function makeBlockMaterials() {
  const top = grassTop();
  const side = grassSide();
  const d = dirt();
  const st = stone();
  const sa = sand();
  const lo = log();
  const le = leaves();
  const wa = water();

  // face order for BoxGeometry: px, nx, py, ny, pz, nz
  const grass = [
    mat(side), mat(side), mat(top), mat(d), mat(side), mat(side),
  ];
  const dirtAll = Array(6).fill(0).map(() => mat(d));
  const stoneAll = Array(6).fill(0).map(() => mat(st));
  const sandAll = Array(6).fill(0).map(() => mat(sa));
  const logAll = [mat(lo), mat(lo), mat(lo), mat(lo), mat(lo), mat(lo)];
  const leavesAll = Array(6).fill(0).map(() => mat(le, { transparent: false }));
  const waterAll = Array(6)
    .fill(0)
    .map(() => mat(wa, { transparent: true, opacity: 0.78 }));

  return {
    grass,
    dirt: dirtAll,
    stone: stoneAll,
    sand: sandAll,
    log: logAll,
    leaves: leavesAll,
    water: waterAll,
  };
}

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import * as skinview3d from "skinview3d";
import { loadImage, loadSkinToCanvas, inferModelType } from "skinview-utils";
import worldUrl from "./assets/world3d/house.glb";
import { usePresence } from "./usePresence";

/* ---- tunables ---- */
const WORLD_SPAN = 80; // house width in units
const CHAR_SCALE = 0.056; // skinview3d player ~32u tall → ~1.8u (human-sized)
const CHAR_GAP = 1.6; // half-spacing between the two at spawn
const CHAR_FORWARD = 0; // forward/back placement
const FLOOR_FRACTION = 0.5; // which floor the couple stand on (0=low,1=roof)
const GROUND_OFFSET = 0;
const STEP = 1.6; // one grid step (block) distance per key press / joystick tick
const STEP_COOLDOWN = 0.12; // seconds between repeated steps when held
const MOVE_LERP = 10; // how snappily the character glides to its target cell

/* GLTF house: auto-centered, auto-scaled, sitting on y=0. */
function WorldModel({ onReady }) {
  const { scene } = useGLTF(worldUrl);
  useEffect(() => {
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = WORLD_SPAN / Math.max(size.x, size.z);
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(scene);
    const c2 = new THREE.Vector3();
    box2.getCenter(c2);
    scene.position.set(-c2.x, -box2.min.y, -c2.z);
    scene.updateMatrixWorld(true);

    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        // material is alphaMode MASK; its alpha was clipping the whole house.
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          m.alphaTest = 0;
          m.transparent = false;
          m.side = THREE.DoubleSide;
          if (m.map) {
            m.map.colorSpace = THREE.SRGBColorSpace;
            m.map.magFilter = THREE.NearestFilter;
            m.map.needsUpdate = true;
          }
          m.needsUpdate = true;
        }
      }
    });

    // find the floor surface the couple stand on
    const finalBox = new THREE.Box3().setFromObject(scene);
    const houseH = finalBox.max.y - finalBox.min.y;
    const rayTop = finalBox.min.y + houseH * FLOOR_FRACTION;
    const ray = new THREE.Raycaster();
    let surfaceY = null;
    for (const [sx, sz] of [
      [0, CHAR_FORWARD], [CHAR_GAP, CHAR_FORWARD], [-CHAR_GAP, CHAR_FORWARD],
      [0, CHAR_FORWARD + 2], [0, CHAR_FORWARD - 2],
    ]) {
      ray.set(new THREE.Vector3(sx, rayTop, sz), new THREE.Vector3(0, -1, 0));
      const hits = ray.intersectObject(scene, true);
      if (hits.length) surfaceY = surfaceY == null ? hits[0].point.y : Math.max(surfaceY, hits[0].point.y);
    }
    onReady((surfaceY ?? finalBox.min.y) + GROUND_OFFSET);
  }, [scene, onReady]);
  return <primitive object={scene} />;
}

/* A character in the scene. If `controlled`, its position is driven by `posRef`
   (a shared THREE.Vector3 the input controller mutates); otherwise it stands at
   its spawn. footLift keeps feet on the ground. */
function Character3D({ skinUrl, spawn, baseRot, lookRef, controlled, posRef, outerGroupRef, remotePosRef, onBroadcast }) {
  const player = useMemo(() => new skinview3d.PlayerObject(), []);
  const localRef = useRef();
  const groupRef = outerGroupRef || localRef;
  const anims = useRef(null);
  const footLift = useRef(0);
  const moving = useRef(false);
  const lastSent = useRef(0);
  const lastSentPos = useRef(null); // last position we broadcast (to skip idle sends)

  useEffect(() => {
    let disposed = false;
    player.scale.setScalar(CHAR_SCALE);
    player.rotation.set(0, 0, 0);
    player.position.set(0, 0, 0);
    player.updateMatrixWorld(true);
    player.traverse((o) => { o.frustumCulled = false; });
    const restBox = new THREE.Box3().setFromObject(player);
    footLift.current = -restBox.min.y;

    loadImage(skinUrl).then((img) => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      loadSkinToCanvas(canvas, img);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      player.skin.map = tex;
      try { player.skin.modelType = inferModelType(canvas); } catch { player.skin.modelType = "default"; }
      player.traverse((o) => {
        o.frustumCulled = false;
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; m.depthTest = true; m.needsUpdate = true;
          }
        }
      });
    });
    anims.current = {
      idle: new skinview3d.IdleAnimation(),
      walk: Object.assign(new skinview3d.WalkingAnimation(), { speed: 1.2 }),
      wave: Object.assign(new skinview3d.WaveAnimation(), { speed: 1.4 }),
    };
    return () => { disposed = true; };
  }, [skinUrl, player]);

  useFrame((state, delta) => {
    const a = anims.current;
    if (!a) return;
    const g = groupRef.current;

    // choose animation: walk while moving (controlled), else idle
    (moving.current ? a.walk : a.idle).update(player, delta);
    player.position.y = 0;
    player.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

    // Decide this character's target: locally-controlled → posRef; otherwise if
    // the partner is driving it over the network → remotePosRef; else stand.
    let target = null;
    if (controlled && posRef) target = posRef.current;
    else if (remotePosRef && remotePosRef.current) target = remotePosRef.current;

    if (target && g) {
      const cur = g.position;
      const before = cur.clone();
      cur.x += (target.x - cur.x) * Math.min(1, MOVE_LERP * delta);
      cur.y += (target.y + footLift.current - cur.y) * Math.min(1, MOVE_LERP * delta);
      cur.z += (target.z - cur.z) * Math.min(1, MOVE_LERP * delta);
      const moved = cur.distanceTo(before);
      moving.current = moved > 0.002;
      if (moving.current) {
        const dir = new THREE.Vector3(target.x - cur.x, 0, target.z - cur.z);
        if (dir.lengthSq() > 0.0001) {
          const yaw = Math.atan2(dir.x, dir.z);
          player.rotation.y += (yaw - player.rotation.y) * 0.2;
        }
      }
      // Broadcast my position to the partner — but ONLY when it actually
      // changed (so a tab left open while standing still sends nothing and
      // can't burn through the realtime quota). Throttled to ~12/sec when moving.
      if (controlled && onBroadcast) {
        lastSent.current += delta;
        if (lastSent.current > 0.08) {
          const p = lastSentPos.current;
          const changed =
            !p ||
            Math.abs(p.x - target.x) > 0.001 ||
            Math.abs(p.y - target.y) > 0.001 ||
            Math.abs(p.z - target.z) > 0.001;
          if (changed) {
            lastSent.current = 0;
            lastSentPos.current = { x: target.x, y: target.y, z: target.z };
            onBroadcast(lastSentPos.current);
          }
        }
      }
    } else {
      moving.current = false;
      const look = lookRef.current;
      const targetYaw = baseRot + look.x * 0.5;
      player.rotation.y += (targetYaw - player.rotation.y) * 0.08;
      const head = player.skin?.head;
      if (head) head.rotation.x += (-look.y * 0.35 - head.rotation.x) * 0.12;
    }
  });

  const initialY = spawn[1] + 0; // group.y set each frame; start near ground
  return (
    <group ref={groupRef} position={[spawn[0], initialY, spawn[2]]}>
      <primitive object={player} />
    </group>
  );
}

/* Grid-stepped movement (keyboard + joystick) for the controlled character.
   Writes the target cell into posRef; camera-relative; Space/Shift = up/down. */
function MovementController({ posRef, controlsRef, joyRef, vertRef }) {
  const keys = useRef({});
  const cooldown = useRef(0);

  useEffect(() => {
    const map = {
      KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b",
      KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r",
      Space: "u", ShiftLeft: "d", ShiftRight: "d",
    };
    const down = (e) => { const k = map[e.code]; if (k) { keys.current[k] = true; e.preventDefault(); } };
    const up = (e) => { const k = map[e.code]; if (k) keys.current[k] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((state, delta) => {
    if (!posRef.current) return;
    cooldown.current -= delta;

    const k = keys.current;
    const joy = joyRef.current; // { x, y } from -1..1, or null
    let f = (k.f ? 1 : 0) - (k.b ? 1 : 0);
    let s = (k.r ? 1 : 0) - (k.l ? 1 : 0);
    let v = (k.u ? 1 : 0) - (k.d ? 1 : 0);
    if (joy) { f += -joy.y; s += joy.x; }
    if (vertRef && vertRef.current) v += vertRef.current; // mobile up/down buttons

    if (cooldown.current > 0) return;
    if (Math.abs(f) < 0.3 && Math.abs(s) < 0.3 && v === 0) return;

    // camera-relative forward/right on the ground plane
    const cam = state.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

    const stepVec = new THREE.Vector3();
    if (Math.abs(f) >= 0.3) stepVec.addScaledVector(fwd, Math.sign(f));
    if (Math.abs(s) >= 0.3) stepVec.addScaledVector(right, Math.sign(s));
    if (stepVec.lengthSq() > 0) stepVec.normalize().multiplyScalar(STEP);
    if (v !== 0) stepVec.y += Math.sign(v) * STEP;

    posRef.current.add(stepVec);
    cooldown.current = STEP_COOLDOWN;
  });
  return null;
}

/* Camera follows the controlled character: shift camera + orbit target by the
   character's movement delta so trackpad orbit/pan still works on top. */
function FollowCamera({ posRef, controlsRef, charGroupRef }) {
  const prev = useRef(null);
  useFrame(() => {
    const controls = controlsRef.current;
    const g = charGroupRef.current;
    if (!controls || !g) return;
    const p = g.position;
    if (!prev.current) {
      prev.current = p.clone();
      controls.target.copy(p);
      controls.object.position.set(p.x + 8, p.y + 6, p.z + 14);
      controls.update();
      return;
    }
    const delta = p.clone().sub(prev.current);
    if (delta.lengthSq() > 0) {
      controls.target.add(delta);
      controls.object.position.add(delta);
    }
    prev.current.copy(p);
  });
  return null;
}

function Loader() {
  return (
    <Html center>
      <div className="font-display italic text-white drop-shadow">loading our world…</div>
    </Html>
  );
}

export default function Scene3D({ skinHer, skinHim, lookRef, controlledChar, joyRef, vertRef }) {
  const controlsRef = useRef();
  const [groundY, setGroundY] = useState(null);

  // shared target-cell + group ref for whichever character the user controls
  const ctrlPosRef = useRef(null);
  const ctrlGroupRef = useRef(null);

  const boyControlled = controlledChar === "boy";
  const girlControlled = controlledChar === "girl";

  // real-time co-presence: broadcast mine, receive partner's
  const { remoteRef, broadcast } = usePresence(controlledChar);

  // initialize the controlled target SYNCHRONOUSLY once ground is known, so the
  // render that gates on ctrlPosRef.current is true the same frame (a ref set
  // in an effect wouldn't re-trigger that gate).
  if (groundY != null && !ctrlPosRef.current) {
    const spawnX = boyControlled ? CHAR_GAP : -CHAR_GAP;
    ctrlPosRef.current = new THREE.Vector3(spawnX, groundY, CHAR_FORWARD);
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 40, 80], fov: 50, near: 1, far: 4000 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#120e1c"]} />
      <fog attach="fog" args={["#1a1326", 200, 900]} />

      <ambientLight intensity={1.05} />
      <directionalLight
        position={[200, 400, 200]}
        intensity={1.4}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={1200}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      <hemisphereLight args={["#c9b6ff", "#3a2f55", 0.7]} />

      <Suspense fallback={<Loader />}>
        <WorldModel onReady={setGroundY} />
        <Environment preset="sunset" />
      </Suspense>

      {groundY != null && ctrlPosRef.current && (
        <>
          <Character3D
            skinUrl={skinHer}
            spawn={[-CHAR_GAP, groundY, CHAR_FORWARD]}
            baseRot={0.15}
            lookRef={lookRef}
            controlled={girlControlled}
            posRef={girlControlled ? ctrlPosRef : null}
            outerGroupRef={girlControlled ? ctrlGroupRef : null}
            remotePosRef={girlControlled ? null : remoteRef}
            onBroadcast={girlControlled ? broadcast : null}
          />
          <Character3D
            skinUrl={skinHim}
            spawn={[CHAR_GAP, groundY, CHAR_FORWARD]}
            baseRot={-0.15}
            lookRef={lookRef}
            controlled={boyControlled}
            posRef={boyControlled ? ctrlPosRef : null}
            outerGroupRef={boyControlled ? ctrlGroupRef : null}
            remotePosRef={boyControlled ? null : remoteRef}
            onBroadcast={boyControlled ? broadcast : null}
          />
          <MovementController posRef={ctrlPosRef} controlsRef={controlsRef} joyRef={joyRef} vertRef={vertRef} />
          <FollowCamera posRef={ctrlPosRef} controlsRef={controlsRef} charGroupRef={ctrlGroupRef} />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableDamping
        dampingFactor={0.08}
        zoomToCursor
        minDistance={4}
        maxDistance={400}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import * as skinview3d from "skinview3d";
import { loadImage, loadSkinToCanvas, inferModelType } from "skinview-utils";
import worldUrl from "./assets/world3d/world.glb";

/* ---- tunables ---- */
const WORLD_SPAN = 16; // world normalized to this many units wide
const CHAR_SCALE = 0.0028; // skinview3d player ~32u tall → in-world size
const CHAR_GAP = 0.08; // half-spacing between the two (close but both visible)
const CHAR_FORWARD = 0.45; // move forward (+z) onto solid ground (~9 blocks)
const MOVE_SPEED = 6; // WASD/arrow walk speed (units/sec)

/* GLTF world: auto-centered, auto-scaled, bottom sitting on y=0. */
function WorldModel({ onReady }) {
  const { scene } = useGLTF(worldUrl);
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m?.map) {
            m.map.magFilter = THREE.NearestFilter;
            m.map.minFilter = THREE.NearestMipmapNearestFilter;
          }
        }
      }
    });
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = WORLD_SPAN / Math.max(size.x, size.z);
    scene.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(scene);
    const c2 = new THREE.Vector3();
    box2.getCenter(c2);
    scene.position.set(-c2.x, -box2.min.y, -c2.z);
    scene.updateMatrixWorld(true);

    // Raycast straight DOWN from high above the center to find the real top
    // surface of the island — no more guessing the height.
    const ray = new THREE.Raycaster();
    const top = new THREE.Box3().setFromObject(scene).max.y;
    let groundY = 0;
    // sample around where the couple stand (forward spot) for the right height
    const samples = [
      [0, CHAR_FORWARD], [0.1, CHAR_FORWARD], [-0.1, CHAR_FORWARD],
      [0, CHAR_FORWARD + 0.1], [0, CHAR_FORWARD - 0.1], [0, 0],
    ];
    for (const [ox, oz] of samples) {
      ray.set(new THREE.Vector3(ox, top + 5, oz), new THREE.Vector3(0, -1, 0));
      const hits = ray.intersectObject(scene, true);
      if (hits.length) groundY = Math.max(groundY, hits[0].point.y);
    }
    if (groundY === 0) groundY = top; // fallback: stand on the very top
    onReady(groundY);
  }, [scene, onReady]);
  return <primitive object={scene} />;
}

/* A character truly inside the scene. groundY = world surface height. */
function Character3D({ skinUrl, x, groundY, baseRot, lookRef, waveRef }) {
  const player = useMemo(() => new skinview3d.PlayerObject(), []);
  const groupRef = useRef();
  const anims = useRef(null);
  const footLift = useRef(0);

  useEffect(() => {
    let disposed = false;
    player.scale.setScalar(CHAR_SCALE);
    loadImage(skinUrl).then((img) => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      loadSkinToCanvas(canvas, img);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      player.skin.map = tex;
      try {
        player.skin.modelType = inferModelType(canvas);
      } catch {
        player.skin.modelType = "default";
      }
      player.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(player);
      footLift.current = -box.min.y; // raise group so feet meet groundY
    });
    anims.current = {
      idle: new skinview3d.IdleAnimation(),
      wave: Object.assign(new skinview3d.WaveAnimation(), { speed: 1.4 }),
    };
    return () => {
      disposed = true;
    };
  }, [skinUrl, player]);

  useFrame((_, delta) => {
    const a = anims.current;
    if (!a) return;
    (waveRef.current ? a.wave : a.idle).update(player, delta);
    player.position.y = 0; // cancel idle vertical bob (it sinks the model)
    if (groupRef.current) groupRef.current.position.y = groundY + footLift.current;
    const look = lookRef.current;
    const targetYaw = baseRot + look.x * 0.5;
    player.rotation.y += (targetYaw - player.rotation.y) * 0.08;
    const head = player.skin?.head;
    if (head) head.rotation.x += (-look.y * 0.35 - head.rotation.x) * 0.12;
  });

  return (
    <group ref={groupRef} position={[x, groundY, CHAR_FORWARD]}>
      <primitive object={player} />
    </group>
  );
}

/* Once we know groundY, frame the camera right in front of the couple's faces. */
function FrameOnCharacters({ groundY }) {
  const { camera } = useThree();
  const done = useRef(false);
  useFrame(() => {
    if (done.current || groundY == null) return;
    done.current = true;
    const faceY = groundY + 0.07; // ~face height above the feet
    // stand in front of the couple (who are at z = CHAR_FORWARD), looking at them
    camera.position.set(0, faceY + 0.02, CHAR_FORWARD + 0.6);
    camera.lookAt(0, faceY, CHAR_FORWARD);
  });
  return null;
}

/* Minecraft-style WASD / arrow movement: glide camera + target on XZ plane. */
function KeyboardControls({ controlsRef }) {
  const keys = useRef({});
  useEffect(() => {
    const map = {
      KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b",
      KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r",
    };
    const down = (e) => { const k = map[e.code]; if (k) { keys.current[k] = true; e.preventDefault(); } };
    const up = (e) => { const k = map[e.code]; if (k) keys.current[k] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  useFrame((state, delta) => {
    const c = controlsRef.current;
    if (!c) return;
    const { f, b, l, r } = keys.current;
    if (!f && !b && !l && !r) return;
    const cam = state.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const move = new THREE.Vector3();
    if (f) move.add(fwd);
    if (b) move.sub(fwd);
    if (r) move.add(right);
    if (l) move.sub(right);
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(MOVE_SPEED * delta);
    cam.position.add(move);
    c.target.add(move);
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

export default function Scene3D({ skinHer, skinHim, lookRef, waveRef }) {
  const controlsRef = useRef();
  const [groundY, setGroundY] = useState(null);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 2, 4], fov: 50, near: 0.01, far: 200 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#120e1c"]} />
      <fog attach="fog" args={["#1a1326", 30, 90]} />

      <ambientLight intensity={1.05} />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.4}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={["#c9b6ff", "#3a2f55", 0.7]} />

      <Suspense fallback={<Loader />}>
        <WorldModel onReady={setGroundY} />
        <Environment preset="sunset" />
      </Suspense>

      {groundY != null && (
        <>
          <Character3D skinUrl={skinHer} x={-CHAR_GAP} groundY={groundY} baseRot={0.15} lookRef={lookRef} waveRef={waveRef} />
          <Character3D skinUrl={skinHim} x={CHAR_GAP} groundY={groundY} baseRot={-0.15} lookRef={lookRef} waveRef={waveRef} />
          <FrameOnCharacters groundY={groundY} />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableDamping
        dampingFactor={0.08}
        zoomToCursor
        minDistance={0.2}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
        target={groundY != null ? [0, groundY + 0.07, CHAR_FORWARD] : [0, 1, 0]}
      />
      <KeyboardControls controlsRef={controlsRef} />
    </Canvas>
  );
}

useGLTF.preload(worldUrl);

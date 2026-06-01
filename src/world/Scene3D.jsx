import { useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import * as skinview3d from "skinview3d";
import { loadImage, loadSkinToCanvas, inferModelType } from "skinview-utils";
import worldUrl from "./assets/world3d/world.glb";

// Our world.glb uses Draco geometry compression; drei's useGLTF auto-loads the
// Draco decoder from the gstatic CDN by default, which handles it.

/* ---- the GLTF Minecraft world ---- */
function WorldModel() {
  const { scene } = useGLTF(worldUrl);
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        // keep pixelated Minecraft look on any textures
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m?.map) {
            m.map.magFilter = THREE.NearestFilter;
            m.map.minFilter = THREE.NearestMipmapNearestFilter;
            m.map.anisotropy = 1;
          }
        }
      }
    });
  }, [scene]);
  // the model bbox is ~4 units wide; scale up so it fills the scene
  return <primitive object={scene} scale={6} position={[0, 0, 0]} />;
}

/* ---- a character built from skinview3d's PlayerObject ----
   Two bugs fixed from the prior attempt:
   1) skin texture needs sRGB colorSpace + flipY=false or it renders blank
   2) drive rotation gently and AFTER the animation update, not fighting it */
function Character({ skinUrl, position, baseRot, lookRef, waveRef, scale = 0.12 }) {
  const groupRef = useRef();
  const player = useRef();
  const anims = useRef(null);

  useEffect(() => {
    let disposed = false;
    const p = new skinview3d.PlayerObject();
    player.current = p;

    // Load the skin exactly the way skinview3d does internally:
    // loadSkinToCanvas (handles legacy/HD normalization) -> CanvasTexture with
    // NearestFilter and NO colorSpace/flipY overrides. This is what made the
    // skin render blank last time (we'd forced sRGB + flipY=false).
    loadImage(skinUrl).then((img) => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      loadSkinToCanvas(canvas, img);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      p.skin.map = tex;
      try {
        p.skin.modelType = inferModelType(canvas);
      } catch {
        p.skin.modelType = "default";
      }
    });

    anims.current = {
      idle: new skinview3d.IdleAnimation(),
      wave: Object.assign(new skinview3d.WaveAnimation(), { speed: 1.4 }),
    };

    groupRef.current.add(p);
    const g = groupRef.current;
    return () => {
      disposed = true;
      g.remove(p);
    };
  }, [skinUrl]);

  useFrame((_, delta) => {
    const p = player.current;
    const a = anims.current;
    if (!p || !a) return;
    // 1) let the base animation pose the body
    (waveRef.current ? a.wave : a.idle).update(p, delta);
    // 2) then add a gentle look-toward-cursor on top
    const look = lookRef.current;
    const targetYaw = baseRot + look.x * 0.5;
    p.rotation.y += (targetYaw - p.rotation.y) * 0.08;
    const head = p.skin?.head;
    if (head) {
      head.rotation.x += (-look.y * 0.35 - head.rotation.x) * 0.12;
    }
  });

  // skinview3d models are ~32 units tall; scale down to sit in the world
  return <group ref={groupRef} position={position} scale={scale} />;
}

/* ---- gentle camera drift + cursor parallax ---- */
function CameraRig({ lookRef, target }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const look = lookRef.current;
    const tx = Math.sin(t * 0.06) * 1.5 + look.x * 1.2;
    const ty = 3.2 - look.y * 0.8;
    camera.position.x += (tx - camera.position.x) * 0.02;
    camera.position.y += (ty - camera.position.y) * 0.02;
    camera.lookAt(target[0], target[1], target[2]);
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

export default function Scene3D({ skinHer, skinHim, lookRef, waveRef, standTarget = [0, 1.2, 0] }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.2, 7], fov: 50 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <color attach="background" args={["#1a1426"]} />
      <fog attach="fog" args={["#241b33", 14, 40]} />

      <ambientLight intensity={0.9} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.3}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={["#c9b6ff", "#3a2f55", 0.6]} />

      <Suspense fallback={<Loader />}>
        <WorldModel />
        <Environment preset="sunset" />
      </Suspense>

      <Character
        skinUrl={skinHer}
        position={[-0.6, standTarget[1], 0]}
        baseRot={0.15}
        lookRef={lookRef}
        waveRef={waveRef}
      />
      <Character
        skinUrl={skinHim}
        position={[0.6, standTarget[1], 0]}
        baseRot={-0.15}
        lookRef={lookRef}
        waveRef={waveRef}
      />

      <CameraRig lookRef={lookRef} target={standTarget} />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.1}
        target={standTarget}
      />
    </Canvas>
  );
}

useGLTF.preload(worldUrl);

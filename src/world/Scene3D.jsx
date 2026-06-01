import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import worldUrl from "./assets/world3d/world.glb";

// Our world.glb uses Draco geometry compression; drei's useGLTF auto-loads the
// Draco decoder from the gstatic CDN by default.

/* The GLTF world, auto-centered and auto-scaled to a known size, with the
   camera framed to it. This removes the guesswork that left the scene blank. */
function WorldModel({ onReady }) {
  const { scene } = useGLTF(worldUrl);
  const ref = useRef();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // pixelated Minecraft textures + shadows
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

    // measure raw model, then normalize: center it, scale so it's ~16 units wide
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetSpan = 16;
    const scale = targetSpan / Math.max(size.x, size.z);

    scene.position.set(-center.x, -box.min.y, -center.z); // sit on y=0, centered
    scene.scale.setScalar(scale);

    onReady?.({
      span: targetSpan,
      topY: (size.y) * scale, // approximate world height after scaling
      groundY: 0,
    });
  }, [scene, onReady]);

  return <primitive ref={ref} object={scene} />;
}

function Loader() {
  return (
    <Html center>
      <div className="font-display italic text-white drop-shadow">loading our world…</div>
    </Html>
  );
}

export default function Scene3D({ onGround }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [14, 10, 16], fov: 50, near: 0.1, far: 200 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#120e1c"]} />
      <fog attach="fog" args={["#1a1326", 30, 90]} />

      <ambientLight intensity={1.0} />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.4}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={["#c9b6ff", "#3a2f55", 0.7]} />

      <Suspense fallback={<Loader />}>
        <WorldModel onReady={onGround} />
        <Environment preset="sunset" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}

useGLTF.preload(worldUrl);

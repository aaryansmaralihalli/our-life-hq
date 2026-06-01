import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as skinview3d from "skinview3d";
import { makeBlockMaterials } from "./blockTextures";
import { generateTerrain } from "./terrain";

/* ---- one InstancedMesh per block type ---- */
function Blocks({ positions, materials }) {
  const ref = useRef();
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);
  if (!positions.length) return null;
  return <instancedMesh ref={ref} args={[geom, materials, positions.length]} castShadow receiveShadow />;
}

/* ---- a character built from skinview3d's PlayerObject (correct skin UVs) ---- */
function VoxelCharacter({ skinUrl, position, lookRef, waveRef, baseRot = 0 }) {
  const groupRef = useRef();
  const playerRef = useRef();
  const animRef = useRef({ idle: null, wave: null, t: 0 });

  useEffect(() => {
    const player = new skinview3d.PlayerObject();
    player.scale.set(1, 1, 1);
    // skinview3d models are ~32 units tall; scale down to ~2 blocks
    player.scale.multiplyScalar(2 / 32);
    playerRef.current = player;

    // load skin texture
    const loader = new THREE.TextureLoader();
    loader.load(skinUrl, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      player.skin.map = tex;
      player.skin.modelType = "default";
    });

    const idle = new skinview3d.IdleAnimation();
    const wave = new skinview3d.WaveAnimation();
    wave.speed = 1.4;
    animRef.current = { idle, wave, t: 0 };

    const g = groupRef.current;
    g.add(player);
    return () => {
      g.remove(player);
    };
  }, [skinUrl]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    const a = animRef.current;
    if (!player) return;
    a.t += delta;
    // base animation
    const anim = waveRef.current ? a.wave : a.idle;
    if (anim) anim.update(player, delta);
    // look toward cursor (lerp)
    const look = lookRef.current;
    const desiredYaw = baseRot + look.x * 0.5;
    player.rotation.y += (desiredYaw - player.rotation.y) * 0.08;
    const head = player.skin?.head;
    if (head) {
      const pitch = -look.y * 0.35;
      head.rotation.x += (pitch - head.rotation.x) * 0.1;
      head.rotation.y += (look.x * 0.5 - head.rotation.y) * 0.1;
    }
  });

  return <group ref={groupRef} position={position} />;
}

/* ---- slow camera drift + subtle parallax toward cursor ---- */
function CameraRig({ lookRef }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const look = lookRef.current;
    const targetX = Math.sin(t * 0.08) * 3 + look.x * 2;
    const targetZ = 18 + Math.cos(t * 0.08) * 1.5;
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.position.y += (7 - look.y * 1.5 - camera.position.y) * 0.02;
    camera.lookAt(0, 2, 0);
  });
  return null;
}

export default function VoxelWorld({ skinHer, skinHim, lookRef, waveRef }) {
  const world = useMemo(() => generateTerrain({ size: 28, seed: 1313 }), []);
  const materials = useMemo(() => makeBlockMaterials(), []);
  const { blocks, standY } = world;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 7, 18], fov: 50 }}
      gl={{ antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* sky */}
      <color attach="background" args={["#aee4ff"]} />
      <fog attach="fog" args={["#cde9ff", 30, 70]} />

      {/* golden-hour lighting */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.4}
        color="#fff2cc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#cfe9ff", "#5a7a3a", 0.5]} />

      {/* voxel terrain */}
      <Blocks positions={blocks.grass} materials={materials.grass} />
      <Blocks positions={blocks.dirt} materials={materials.dirt} />
      <Blocks positions={blocks.stone} materials={materials.stone} />
      <Blocks positions={blocks.sand} materials={materials.sand} />
      <Blocks positions={blocks.log} materials={materials.log} />
      <Blocks positions={blocks.leaves} materials={materials.leaves} />
      <Blocks positions={blocks.water} materials={materials.water} />

      {/* the couple, standing on the central ground */}
      <VoxelCharacter
        skinUrl={skinHer}
        position={[-0.7, standY, 0]}
        lookRef={lookRef}
        waveRef={waveRef}
        baseRot={0.15}
      />
      <VoxelCharacter
        skinUrl={skinHim}
        position={[0.7, standY, 0]}
        lookRef={lookRef}
        waveRef={waveRef}
        baseRot={-0.15}
      />

      <CameraRig lookRef={lookRef} />
    </Canvas>
  );
}

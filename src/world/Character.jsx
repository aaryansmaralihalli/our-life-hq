import { useEffect, useRef } from "react";
import * as skinview3d from "skinview3d";

/* Renders one Minecraft character from a 64x64 skin data URL using skinview3d.
   Exposes intent via props:
   - lookAt: {x,y} normalized [-1,1] cursor position (head/body turn toward it)
   - waving: boolean (play a wave, else idle)
   skinview3d runs its own three.js loop inside a dedicated <canvas>. */
export default function Character({ skin, width = 220, height = 340, lookAt, waving, flip = false }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const idleRef = useRef(null);
  const waveRef = useRef(null);
  const lookRef = useRef({ x: 0, y: 0 });
  const wavingRef = useRef(false);

  // keep latest intent in refs (read inside the animation tick)
  lookRef.current = lookAt || { x: 0, y: 0 };
  wavingRef.current = !!waving;

  useEffect(() => {
    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
      skin,
    });
    viewer.autoRotate = false;
    viewer.controls.enableZoom = false;
    viewer.controls.enableRotate = false;
    viewer.controls.enablePan = false;
    viewer.zoom = 0.85;
    viewer.camera.position.z = 60;
    viewer.fov = 40;

    // base idle animation
    const idle = viewer.animations.add(skinview3d.IdleAnimation);
    idle.speed = 1;
    idleRef.current = idle;

    if (flip) viewer.playerObject.rotation.y = -0.2;

    viewerRef.current = viewer;

    // custom per-frame "look toward cursor" on top of idle
    let raf;
    const tick = () => {
      const player = viewer.playerObject;
      if (player) {
        const target = lookRef.current;
        // body yaw toward cursor x; head pitch toward cursor y
        const baseYaw = flip ? -0.18 : 0.18;
        const desiredYaw = baseYaw + target.x * 0.5;
        const desiredHeadPitch = -target.y * 0.4;
        player.rotation.y += (desiredYaw - player.rotation.y) * 0.08; // lerp
        const head = player.skin.head;
        if (head) {
          head.rotation.x += (desiredHeadPitch - head.rotation.x) * 0.1;
          head.rotation.y += (target.x * 0.5 - head.rotation.y) * 0.1;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      viewer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin]);

  // toggle wave animation when `waving` flips
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (waving && !waveRef.current) {
      const wave = viewer.animations.add(skinview3d.WaveAnimation);
      wave.speed = 1.5;
      waveRef.current = wave;
    } else if (!waving && waveRef.current) {
      waveRef.current.remove();
      waveRef.current = null;
    }
  }, [waving]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}

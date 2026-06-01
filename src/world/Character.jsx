import { useEffect, useRef } from "react";
import * as skinview3d from "skinview3d";

/* Renders one Minecraft character from a 64x64 skin data URL using skinview3d 3.x.
   Intent props:
   - lookAt: {x,y} normalized [-1,1] cursor position (head/body turn toward it)
   - waving: boolean (play wave, else idle)
   skinview3d 3.x uses a single `viewer.animation`; we layer a look-at function
   onto it via `addAnimation`. */
export default function Character({ skin, width = 220, height = 340, lookAt, waving, flip = false }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const lookRef = useRef({ x: 0, y: 0 });

  // keep latest cursor intent in a ref (read inside the animation tick)
  lookRef.current = lookAt || { x: 0, y: 0 };

  useEffect(() => {
    let viewer;
    try {
      viewer = new skinview3d.SkinViewer({
        canvas: canvasRef.current,
        width,
        height,
        skin,
        zoom: 0.8,
        fov: 40,
      });
    } catch (err) {
      console.error("SkinViewer init failed:", err);
      return;
    }
    if (viewer.controls) {
      viewer.controls.enableZoom = false;
      viewer.controls.enableRotate = false;
      viewer.controls.enablePan = false;
    }

    const baseYaw = flip ? -0.18 : 0.18;

    // the look-at function, layered on top of whatever base animation plays
    const lookFn = (player) => {
      const t = lookRef.current;
      const desiredYaw = baseYaw + t.x * 0.5;
      player.rotation.y += (desiredYaw - player.rotation.y) * 0.08; // smooth lerp
      const head = player.skin?.head;
      if (head) {
        const desiredPitch = -t.y * 0.35;
        head.rotation.x += (desiredPitch - head.rotation.x) * 0.1;
        head.rotation.y += (t.x * 0.5 - head.rotation.y) * 0.1;
      }
    };

    const idle = new skinview3d.IdleAnimation();
    idle.addAnimation(lookFn);
    const wave = new skinview3d.WaveAnimation();
    wave.speed = 1.4;
    wave.addAnimation(lookFn);

    viewer.animation = idle;
    viewer._idle = idle;
    viewer._wave = wave;
    viewerRef.current = viewer;

    return () => {
      try {
        viewer.dispose();
      } catch {}
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin]);

  // swap base animation when `waving` flips
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.animation = waving ? viewer._wave : viewer._idle;
  }, [waving]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}

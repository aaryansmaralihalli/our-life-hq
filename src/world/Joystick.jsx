import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/* On-screen controls for touch devices:
   - left joystick → horizontal movement, writes {x,y} (-1..1) to joyRef
   - right up/down buttons → fly up / come down, writes -1/0/1 to vertRef
   Only shows on touch-capable screens. */
export default function Joystick({ joyRef, vertRef }) {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  if (!isTouch) return null;

  const RADIUS = 56;

  const update = (clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    joyRef.current = { x: dx / RADIUS, y: dy / RADIUS };
  };

  const end = () => {
    setActive(false);
    setKnob({ x: 0, y: 0 });
    joyRef.current = null;
  };

  const setVert = (v) => {
    if (vertRef) vertRef.current = v;
  };

  return (
    <>
      {/* left: movement joystick */}
      <div
        ref={baseRef}
        onTouchStart={(e) => {
          setActive(true);
          const t = e.touches[0];
          update(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          update(t.clientX, t.clientY);
        }}
        onTouchEnd={end}
        onTouchCancel={end}
        className="fixed bottom-24 left-6 z-30 grid h-32 w-32 touch-none select-none place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div
          className="h-14 w-14 rounded-full bg-white/70 shadow-lg"
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
            transition: active ? "none" : "transform 150ms",
          }}
        />
      </div>

      {/* right: fly up / come down */}
      <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-3 select-none">
        <button
          onTouchStart={(e) => { e.preventDefault(); setVert(1); }}
          onTouchEnd={() => setVert(0)}
          onTouchCancel={() => setVert(0)}
          className="grid h-16 w-16 touch-none place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur active:bg-white/35"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label="Fly up"
        >
          <ChevronUp size={28} />
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); setVert(-1); }}
          onTouchEnd={() => setVert(0)}
          onTouchCancel={() => setVert(0)}
          className="grid h-16 w-16 touch-none place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur active:bg-white/35"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label="Come down"
        >
          <ChevronDown size={28} />
        </button>
      </div>
    </>
  );
}

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Target, UtensilsCrossed, Plane, Dumbbell, HeartPulse, LayoutDashboard } from "lucide-react";
import VoxelWorld from "../world/VoxelWorld";
import Portal from "../world/Portal";
import WorldBoundary from "../world/WorldBoundary";
import skinHer from "../world/assets/skin-her.png";
import skinHim from "../world/assets/skin-him.png";

/* Scripted idle lines the couple "say" while you're not interacting. */
const IDLE_LINES = [
  "Hey… remember this? 📼",
  "Wanna look back at our memories?",
  "Psst — click the tape ✨",
  "We've made so many memories together 💖",
];

/* Object shortcuts that float around the characters → existing sections. */
const OBJECTS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", emoji: "🏠" },
  { to: "/bucket", icon: Target, label: "Dreams", emoji: "📖" },
  { to: "/food", icon: UtensilsCrossed, label: "Food", emoji: "🍖" },
  { to: "/travel", icon: Plane, label: "Travel", emoji: "🗺️" },
  { to: "/gym", icon: Dumbbell, label: "Gym", emoji: "💪" },
  { to: "/health", icon: HeartPulse, label: "Health", emoji: "⚖️" },
];

export default function World() {
  // Render to document.body so the full-screen scene escapes Layout's blurred,
  // max-width page-transition wrapper (a CSS filter creates a containing block
  // that would otherwise trap our `position: fixed`).
  return createPortal(
    <WorldBoundary>
      <WorldScene />
    </WorldBoundary>,
    document.body
  );
}

function WorldScene() {
  const navigate = useNavigate();

  const [idle, setIdle] = useState(false);
  const [line, setLine] = useState(IDLE_LINES[0]);
  const [portalOpen, setPortalOpen] = useState(false);

  // refs read by the R3F render loop (no re-render on every mouse move)
  const lookRef = useRef({ x: 0, y: 0 });
  const waveRef = useRef(false);

  const idleTimer = useRef(null);
  const lineIndex = useRef(0);
  const idleRef = useRef(false);

  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lineIndex.current = (lineIndex.current + 1) % IDLE_LINES.length;
      setLine(IDLE_LINES[lineIndex.current]);
      idleRef.current = true;
      setIdle(true);
    }, 4000);
  }, []);

  // mouse intent → drive refs; keep the suggestion up while you reach for it
  const onMove = useCallback(
    (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      lookRef.current = { x, y };
      waveRef.current = Math.abs(x) < 0.35 && y > 0.1;
      if (!idleRef.current) scheduleIdle();
    },
    [scheduleIdle]
  );

  const dismissIdle = useCallback(() => {
    idleRef.current = false;
    setIdle(false);
    scheduleIdle();
  }, [scheduleIdle]);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    scheduleIdle();
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(idleTimer.current);
    };
  }, [onMove, scheduleIdle]);

  return (
    <div className="fixed inset-0 z-0 select-none overflow-hidden">
      {/* live 3D voxel world (characters + terrain in one scene) */}
      <VoxelWorld skinHer={skinHer} skinHim={skinHim} lookRef={lookRef} waveRef={waveRef} />

      {/* soft vignette so floating UI stays readable */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/15 via-transparent to-black/25" />

      {/* title + hint, floating top */}
      <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 text-center">
        <h1 className="font-display text-3xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-4xl">
          Our World
        </h1>
        <p className="text-sm text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          move your mouse — they'll follow you 👀
        </p>
      </div>

      {/* object shortcuts */}
      <div className="absolute left-1/2 top-24 z-10 flex max-w-[92vw] -translate-x-1/2 flex-wrap justify-center gap-2">
        {OBJECTS.map((o) => (
          <motion.button
            key={o.to}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(o.to)}
            className="glass flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-semibold shadow-lg"
          >
            <span>{o.emoji}</span>
            {o.label}
          </motion.button>
        ))}
      </div>

      {/* speech bubble + VHS tape, centered above the couple */}
      <div className="pointer-events-none absolute bottom-[30vh] left-1/2 z-10 -translate-x-1/2">
        <AnimatePresence>
          {idle && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="pointer-events-auto relative"
            >
              <button
                onClick={dismissIdle}
                className="glass relative whitespace-nowrap rounded-2xl px-4 py-2 text-center font-semibold shadow-lg"
                title="dismiss"
              >
                {line}
                <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/55" />
              </button>
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ y: { duration: 2.4, repeat: Infinity }, rotate: { duration: 5, repeat: Infinity } }}
                onClick={() => {
                  setPortalOpen(true);
                  dismissIdle();
                }}
                className="pointer-events-auto absolute -right-12 -top-2 text-5xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
                title="Open our memories"
              >
                📼
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Portal open={portalOpen} onClose={() => setPortalOpen(false)} />
    </div>
  );
}

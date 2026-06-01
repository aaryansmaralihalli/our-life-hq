import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Target, UtensilsCrossed, Plane, Dumbbell, HeartPulse, LayoutDashboard } from "lucide-react";
import Character from "../world/Character";
import Portal from "../world/Portal";
import WorldBoundary from "../world/WorldBoundary";
import { makeHerSkin, makeHimSkin } from "../world/skins";

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
  return (
    <WorldBoundary>
      <WorldScene />
    </WorldBoundary>
  );
}

function WorldScene() {
  const navigate = useNavigate();
  const herSkin = useMemo(() => makeHerSkin(), []);
  const himSkin = useMemo(() => makeHimSkin(), []);

  const [look, setLook] = useState({ x: 0, y: 0 });
  const [idle, setIdle] = useState(false);
  const [line, setLine] = useState(IDLE_LINES[0]);
  const [waving, setWaving] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);

  const idleTimer = useRef(null);
  const lineIndex = useRef(0);
  const idleRef = useRef(false); // mirror of `idle` for the move handler

  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lineIndex.current = (lineIndex.current + 1) % IDLE_LINES.length;
      setLine(IDLE_LINES[lineIndex.current]);
      idleRef.current = true;
      setIdle(true);
    }, 4000);
  }, []);

  // --- mouse intent: always track cursor; but DON'T dismiss an active
  // suggestion just because the mouse moved (so you can reach the tape). ---
  const onMove = useCallback(
    (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1; // [-1,1]
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setLook({ x, y }); // head/eyes keep following — that's fine

      // wave when the cursor comes near the characters (center-bottom)
      setWaving(Math.abs(x) < 0.35 && y > 0.1);

      // only the idle countdown restarts on movement; once the suggestion is
      // showing it stays put until dismissed/used.
      if (!idleRef.current) scheduleIdle();
    },
    [scheduleIdle]
  );

  // dismiss the current suggestion (e.g. after opening the portal)
  const dismissIdle = useCallback(() => {
    idleRef.current = false;
    setIdle(false);
    scheduleIdle();
  }, [scheduleIdle]);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    scheduleIdle(); // first countdown
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(idleTimer.current);
    };
  }, [onMove, scheduleIdle]);

  return (
    <div className="relative min-h-[80vh] select-none">
      {/* sky / ground backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-[#9fd0ff] via-[#cfe9ff] to-[#8fb96a]" />
        {/* sun */}
        <div className="absolute right-12 top-10 h-16 w-16 rounded-full bg-yellow-200 shadow-[0_0_60px_30px_rgba(255,240,170,0.7)]" />
        {/* simple voxel clouds */}
        <div className="absolute left-10 top-12 h-6 w-24 rounded bg-white/80" />
        <div className="absolute left-1/3 top-6 h-6 w-32 rounded bg-white/70" />
        {/* ground line */}
        <div className="absolute bottom-0 h-1/4 w-full bg-[#6f9a4a]" />
      </div>

      <div className="mb-2 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Our World</h1>
        <p className="text-ink-soft">move your mouse — they'll follow you 👀</p>
      </div>

      {/* object shortcuts */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {OBJECTS.map((o) => (
          <motion.button
            key={o.to}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(o.to)}
            className="glass flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-semibold shadow"
          >
            <span>{o.emoji}</span>
            {o.label}
          </motion.button>
        ))}
      </div>

      {/* characters + speech */}
      <div className="relative mx-auto flex max-w-xl items-end justify-center pb-10">
        {/* speech bubble */}
        <AnimatePresence>
          {idle && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute left-1/2 top-0 z-20 -translate-x-1/2"
            >
              <button
                onClick={dismissIdle}
                className="glass relative rounded-2xl px-4 py-2 text-center font-semibold shadow-lg"
                title="dismiss"
              >
                {line}
                <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/55" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end">
          <Character skin={herSkin} lookAt={look} waving={waving} flip />
          <Character skin={himSkin} lookAt={look} waving={waving} />
        </div>

        {/* the VHS tape — appears when idle, click → portal */}
        <AnimatePresence>
          {idle && (
            <motion.button
              initial={{ opacity: 0, y: -20, rotate: -10 }}
              animate={{ opacity: 1, y: [0, -10, 0], rotate: [0, 4, -4, 0] }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ y: { duration: 2.4, repeat: Infinity }, rotate: { duration: 5, repeat: Infinity } }}
              onClick={() => {
                setPortalOpen(true);
                dismissIdle();
              }}
              className="absolute right-6 top-6 z-20 text-5xl drop-shadow-lg"
              title="Open our memories"
            >
              📼
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Portal open={portalOpen} onClose={() => setPortalOpen(false)} />
    </div>
  );
}

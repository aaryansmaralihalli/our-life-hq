import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Home,
  Sparkles,
  Target,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  HeartPulse,
  User,
} from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/world", label: "Our World", icon: Sparkles },
  { to: "/bucket", label: "Bucket List", icon: Target },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/travel", label: "Travel", icon: Plane },
  { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/health", label: "Health", icon: HeartPulse },
  { to: "/profile", label: "Profile", icon: User },
];

function DockIcon({ item, mouseX, active }) {
  const ref = useRef(null);
  const Icon = item.icon;

  // distance of this icon's center from the cursor
  const distance = useTransform(mouseX, (val) => {
    const b = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - b.x - b.width / 2;
  });

  // magnify nearby icons (macOS dock effect)
  const sizeSync = useTransform(distance, [-140, 0, 140], [46, 74, 46]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 170, damping: 14 });
  const iconSize = useTransform(size, (s) => s * 0.44);

  return (
    <Link to={item.to} className="group relative grid place-items-center">
      {/* tooltip */}
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-cream opacity-0 transition group-hover:opacity-100">
        {item.label}
      </span>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        className={`grid place-items-center rounded-2xl transition-colors ${
          active
            ? "bg-gradient-to-br from-coral-light to-coral text-white shadow-lg"
            : "bg-white/70 text-ink-soft hover:text-coral"
        }`}
      >
        <motion.div style={{ width: iconSize, height: iconSize }} className="grid place-items-center">
          <Icon className="h-full w-full" strokeWidth={2.2} />
        </motion.div>
      </motion.div>
      {/* active dot */}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="dock-dot"
            className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-coral"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </Link>
  );
}

export default function Dock() {
  const mouseX = useMotionValue(Infinity);
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.2 }}
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
    >
      <div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="glass flex items-end gap-2 rounded-[28px] px-3 pb-2 pt-2 shadow-2xl sm:gap-3 sm:px-4"
      >
        {ITEMS.map((item) => (
          <DockIcon
            key={item.to}
            item={item}
            mouseX={mouseX}
            active={item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)}
          />
        ))}
      </div>
    </motion.nav>
  );
}

import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ---- shared variants ---- */
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.25 } },
};

/* A list whose children fade+rise in sequence as they scroll into view */
export function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 110, damping: 20, delay }}
    >
      {children}
    </motion.div>
  );
}

/* Number that counts up smoothly when it scrolls into view */
export function AnimatedNumber({ value, decimals = 0, className = "", format }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value || 0, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  const shown = format ? format(display) : display.toFixed(decimals);
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}

/* Card that tilts slightly toward the cursor (Apple-ish depth) */
export function TiltCard({ children, className = "", intensity = 6, ...rest }) {
  const ref = useRef(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * intensity);
    rx.set(-py * intensity);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ y: -4 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export { motion };

import { useEffect, useState } from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---- Card ---- */
export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-3xl glass shadow-[0_12px_34px_-16px_rgba(120,70,50,0.35)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---- Buttons ---- */
export function Button({ variant = "primary", className = "", ...rest }) {
  const styles = {
    primary:
      "bg-gradient-to-br from-coral-light to-coral text-white hover:brightness-105",
    ghost: "bg-white/70 text-ink hover:bg-white",
    soft: "bg-coral/10 text-coral hover:bg-coral/20",
    danger: "bg-white/70 text-red-600 hover:bg-red-50",
  };
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-semibold shadow-sm disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}

/* ---- Inputs ---- */
export function Field({ label, children, hint }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-semibold text-ink-soft">{label}</span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border-0 bg-white/80 px-3.5 py-2.5 text-ink shadow-inner outline-none ring-1 ring-black/5 transition focus:ring-2 focus:ring-coral/40";

export function Input(props) {
  return <input className={inputCls} {...props} />;
}
export function Textarea(props) {
  return <textarea className={`${inputCls} min-h-20 resize-y`} {...props} />;
}
export function Select({ options, ...props }) {
  return (
    <select className={inputCls} {...props}>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  );
}

/* ---- Chip toggle ---- */
export function Chip({ active, children, ...rest }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-coral text-white shadow"
          : "bg-white/70 text-ink-soft hover:bg-white"
      }`}
      {...rest}
    />
  );
}

/* ---- Badge ---- */
const toneCls = {
  good: "bg-sage/15 text-sage",
  warn: "bg-gold/20 text-[#9a6f12]",
  high: "bg-red-100 text-red-700",
  low: "bg-blue-100 text-blue-700",
  neutral: "bg-black/5 text-ink-soft",
};
export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneCls[tone]}`}>
      {children}
    </span>
  );
}

/* ---- Status picker: a badge that, on hover/click, reveals options inline ----
   Lets you change an item's status without opening a modal. */
export function StatusPicker({ value, options, tones = {}, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
          toneCls[tones[value] || "neutral"]
        }`}
      >
        {value}
        <ChevronDown size={12} className="opacity-60" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-full z-30 mt-1.5 w-40 overflow-hidden rounded-2xl p-1 shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-coral/10 ${
                  opt === value ? "text-coral" : "text-ink-soft"
                }`}
              >
                {opt}
                {opt === value && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Modal (animated) ---- */
export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-3xl ${
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-ink-soft transition hover:bg-black/5">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Progress ---- */
export function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-black/10 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-gold via-coral-light to-coral"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
    </div>
  );
}

export function Ring({ value, size = 64, label, stroke = 6 }) {
  const r = (size - stroke - 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-coral)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {label ?? `${Math.round(value)}%`}
      </span>
    </div>
  );
}

/* ---- Empty state ---- */
export function Empty({ emoji = "✨", children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-14 text-center text-ink-soft"
    >
      <motion.div
        className="mb-2 text-4xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {emoji}
      </motion.div>
      <p className="font-display text-lg italic">{children}</p>
    </motion.div>
  );
}

/* ---- Section header ---- */
export function PageHeader({ title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

/* ---- delete confirm helper ---- */
export const confirmDelete = (what = "this item") =>
  window.confirm(`Delete ${what}? This can't be undone.`);

/* ---- celebration confetti ---- */
export function burstConfetti(x, y) {
  const emojis = ["🎉", "✨", "🌟", "💖", "🎊", "🌸", "⭐", "🔥"];
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("span");
    s.className = "confetti-piece";
    s.textContent = emojis[(Math.random() * emojis.length) | 0];
    s.style.left = x + (Math.random() * 180 - 90) + "px";
    s.style.top = y + "px";
    s.style.fontSize = 14 + Math.random() * 20 + "px";
    s.style.animationDuration = 1.3 + Math.random() * 1.4 + "s";
    s.style.animationDelay = Math.random() * 0.15 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}

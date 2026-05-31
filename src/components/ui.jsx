import { useEffect } from "react";
import { X } from "lucide-react";

/* ---- Card ---- */
export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-3xl bg-white/70 backdrop-blur shadow-[0_12px_34px_-16px_rgba(120,70,50,0.35)] ${className}`}
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
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-semibold transition shadow-sm disabled:opacity-50 ${styles[variant]} ${className}`}
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
  "w-full rounded-xl border-0 bg-white/80 px-3.5 py-2.5 text-ink shadow-inner outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-coral/40";

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
    <button
      type="button"
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-coral text-white shadow"
          : "bg-white/70 text-ink-soft hover:bg-white"
      }`}
      {...rest}
    >
      {children}
    </button>
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

/* ---- Modal ---- */
export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`animate-pop max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl sm:rounded-3xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-soft hover:bg-black/5">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---- Progress ---- */
export function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-black/10 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold via-coral-light to-coral transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Ring({ value, size = 64, label }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-coral)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
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
    <div className="py-14 text-center text-ink-soft">
      <div className="mb-2 text-4xl">{emoji}</div>
      <p className="font-display text-lg italic">{children}</p>
    </div>
  );
}

/* ---- Section header ---- */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---- delete confirm helper ---- */
export const confirmDelete = (what = "this item") =>
  window.confirm(`Delete ${what}? This can't be undone.`);

/* ---- celebration confetti ---- */
export function burstConfetti(x, y) {
  const emojis = ["🎉", "✨", "🌟", "💖", "🎊", "🌸", "⭐", "🔥"];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement("span");
    s.className = "confetti-piece";
    s.textContent = emojis[(Math.random() * emojis.length) | 0];
    s.style.left = x + (Math.random() * 160 - 80) + "px";
    s.style.top = y + "px";
    s.style.fontSize = 14 + Math.random() * 18 + "px";
    s.style.animationDuration = 1.3 + Math.random() * 1.2 + "s";
    s.style.animationDelay = Math.random() * 0.15 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3000);
  }
}

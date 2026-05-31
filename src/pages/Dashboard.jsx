import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  HeartPulse,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { useData } from "../context/AppData";
import { Card, Ring, Badge } from "../components/ui";
import { AnimatedNumber, TiltCard, fadeUp, stagger } from "../components/motion";
import { HOME_BASE } from "../lib/constants";
import { haversineKm, bmi, bmiCategory, round } from "../lib/formulas";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { bucket_items, food_spots, destinations, gym_entries, health_entries, people } = useData();

  const bTotal = bucket_items.length;
  const bDone = bucket_items.filter((b) => b.status === "Done").length;
  const bPct = bTotal ? Math.round((bDone / bTotal) * 100) : 0;

  const fTotal = food_spots.length;
  const fDone = food_spots.filter((f) => f.status === "Conquered").length;
  const fRecent = [...food_spots]
    .filter((f) => f.visited_on)
    .sort((a, b) => (b.visited_on || "").localeCompare(a.visited_on || ""))[0];

  const tTotal = destinations.length;
  const tVisited = destinations.filter((d) => d.status === "Visited").length;
  const visitedKm = round(
    destinations
      .filter((d) => d.status === "Visited" && d.lat != null)
      .reduce((s, d) => s + haversineKm(HOME_BASE, d), 0),
    0
  );

  const thisMonth = todayISO().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const volIn = (mk) =>
    gym_entries.filter((e) => (e.date || "").startsWith(mk)).reduce((s, e) => s + (e.volume || 0), 0);
  const monthVol = round(volIn(thisMonth), 0);
  const prevVol = round(volIn(lastMonth), 0);
  const volTrend = monthVol - prevVol;
  const bestE1rm = (name) =>
    round(Math.max(0, ...gym_entries.filter((e) => e.who === name).map((e) => e.e1rm || 0)), 1);

  const healthFor = (p) => {
    const rows = health_entries
      .filter((r) => r.who === p.name)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return null;
    const latest = rows[rows.length - 1];
    const first = rows[0];
    const b = bmi(latest.weight, p.height_cm);
    return {
      weight: latest.weight,
      delta: round(latest.weight - first.weight, 1),
      bmi: round(b, 1),
      cat: bmiCategory(b, "icmr"),
    };
  };

  const upcoming = [
    ...bucket_items
      .filter((b) => b.target_date && b.status !== "Done")
      .map((b) => ({ date: b.target_date, label: b.dream, kind: "🎯" })),
    ...destinations
      .filter((d) => d.status === "Planned")
      .map((d) => ({ date: d.visited_on || "9999-99-99", label: `Trip to ${d.name}`, kind: "✈️" })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="mb-2 font-display text-sm italic text-ink-soft">{greeting} 🌅</div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
          Look how far <br className="hidden sm:block" />
          <span className="shimmer">we've come.</span>
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Your shared life, in motion — {bDone + fDone + tVisited} milestones reached and counting.
        </p>
      </motion.div>

      {/* metric grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <MetricCard to="/bucket" icon={Target} title="Bucket list" tint="from-coral-light to-coral">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-4xl font-bold">
                <AnimatedNumber value={bDone} />
                <span className="text-ink-soft">/{bTotal}</span>
              </div>
              <div className="text-sm text-ink-soft">dreams fulfilled</div>
            </div>
            <Ring value={bPct} size={72} />
          </div>
        </MetricCard>

        <MetricCard to="/food" icon={UtensilsCrossed} title="Food" tint="from-gold to-coral-light">
          <div className="font-display text-4xl font-bold">
            <AnimatedNumber value={fDone} />
            <span className="text-ink-soft">/{fTotal}</span>
          </div>
          <div className="text-sm text-ink-soft">spots conquered</div>
          {fRecent && (
            <div className="mt-2 text-sm">
              Latest: <b>{fRecent.place}</b>
            </div>
          )}
        </MetricCard>

        <MetricCard to="/travel" icon={Plane} title="Travel" tint="from-sage to-[#4f6b54]">
          <div className="font-display text-4xl font-bold">
            <AnimatedNumber value={tVisited} />
            <span className="text-ink-soft">/{tTotal}</span>
          </div>
          <div className="text-sm text-ink-soft">destinations visited</div>
          <div className="mt-2 text-sm">
            <b>
              <AnimatedNumber value={visitedKm} format={(v) => Math.round(v).toLocaleString()} /> km
            </b>{" "}
            explored from {HOME_BASE.name}
          </div>
        </MetricCard>

        <MetricCard to="/gym" icon={Dumbbell} title="Gym" tint="from-[#7c6f9c] to-[#5a4f78]">
          <div className="flex items-center gap-2">
            <div className="font-display text-4xl font-bold">
              <AnimatedNumber value={monthVol} format={(v) => Math.round(v).toLocaleString()} />
            </div>
            {prevVol > 0 && (
              <Badge tone={volTrend >= 0 ? "good" : "high"}>
                {volTrend >= 0 ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} vs last mo
              </Badge>
            )}
          </div>
          <div className="text-sm text-ink-soft">kg lifted this month</div>
          <div className="mt-2 space-y-0.5 text-sm">
            {people.map((p) => (
              <div key={p.id}>
                {p.name}: best 1RM <b>{bestE1rm(p.name)} kg</b>
              </div>
            ))}
          </div>
        </MetricCard>

        <MetricCard to="/health" icon={HeartPulse} title="Health" tint="from-[#b5557a] to-[#8c3f5e]">
          <div className="space-y-1.5">
            {people.map((p) => {
              const h = healthFor(p);
              return (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{p.name}</span>
                  {h ? (
                    <span className="flex items-center gap-2">
                      {h.weight} kg
                      <Badge tone={h.cat.tone}>BMI {h.bmi}</Badge>
                      <span className="text-xs text-ink-soft">
                        {h.delta === 0 ? "—" : `${h.delta > 0 ? "+" : ""}${h.delta}`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-ink-soft">no data</span>
                  )}
                </div>
              );
            })}
          </div>
        </MetricCard>

        <MetricCard to="/bucket" icon={CalendarDays} title="Upcoming" tint="from-[#3f7d8c] to-[#2c5a66]">
          {upcoming.length === 0 ? (
            <div className="text-sm text-ink-soft">Nothing scheduled — dream something up!</div>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{u.kind}</span>
                  <span className="flex-1 truncate">{u.label}</span>
                  {u.date !== "9999-99-99" && (
                    <span className="text-xs text-ink-soft">
                      {new Date(u.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </MetricCard>
      </motion.div>
    </div>
  );
}

function MetricCard({ to, icon: Icon, title, tint, children }) {
  return (
    <motion.div variants={fadeUp}>
      <Link to={to}>
        <TiltCard className="group h-full">
          <Card className="relative h-full overflow-hidden p-5">
            <ArrowUpRight
              size={18}
              className="absolute right-4 top-4 text-ink-soft opacity-0 transition group-hover:opacity-100"
            />
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                <Icon size={18} />
              </span>
              <span className="font-semibold">{title}</span>
            </div>
            {children}
          </Card>
        </TiltCard>
      </Link>
    </motion.div>
  );
}

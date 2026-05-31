import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { useData } from "../context/AppData";
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Modal,
  Chip,
  Badge,
  Empty,
  PageHeader,
} from "../components/ui";
import {
  MUSCLES,
  EXERCISES_BY_MUSCLE,
  MUSCLES_FOR_EXERCISE,
  CARDIO_MUSCLE,
  todayISO,
} from "../lib/constants";
import { volume as calcVolume, epley1RM, round } from "../lib/formulas";

const PALETTE = ["#c75b39", "#d9a441", "#6b7f6e", "#7c6f9c", "#b5557a", "#3f7d8c", "#e07856"];

export default function Gym() {
  const { gym_entries, people, add, remove } = useData();
  const [logging, setLogging] = useState(false);
  const [personFilter, setPersonFilter] = useState("All");
  const [exFilter, setExFilter] = useState("All");

  const names = people.map((p) => p.name);

  const filtered = useMemo(
    () =>
      gym_entries.filter(
        (e) =>
          (personFilter === "All" || e.who === personFilter) &&
          (exFilter === "All" || e.exercise === exFilter)
      ),
    [gym_entries, personFilter, exFilter]
  );

  const exercises = useMemo(
    () => [...new Set(gym_entries.map((e) => e.exercise))].sort(),
    [gym_entries]
  );

  // This-month volume
  const monthKey = todayISO().slice(0, 7);
  const monthVolume = round(
    gym_entries.filter((e) => (e.date || "").startsWith(monthKey)).reduce((s, e) => s + (e.volume || 0), 0),
    0
  );

  // PRs per person+exercise
  const prs = useMemo(() => {
    const map = {};
    for (const e of gym_entries) {
      const k = `${e.who}|${e.exercise}`;
      if (!map[k]) map[k] = { who: e.who, exercise: e.exercise, best1rm: 0, bestVol: 0, date: e.date };
      if ((e.e1rm || 0) > map[k].best1rm) {
        map[k].best1rm = e.e1rm || 0;
        map[k].date = e.date;
      }
      if ((e.volume || 0) > map[k].bestVol) map[k].bestVol = e.volume || 0;
    }
    return Object.values(map).sort((a, b) => b.best1rm - a.best1rm);
  }, [gym_entries]);

  // e1RM-over-time chart data (only meaningful when one exercise is selected)
  const lineData = useMemo(() => {
    if (exFilter === "All") return [];
    const byDate = {};
    for (const e of gym_entries.filter((e) => e.exercise === exFilter)) {
      byDate[e.date] ||= { date: e.date };
      byDate[e.date][e.who] = Math.max(byDate[e.date][e.who] || 0, round(e.e1rm, 1) || 0);
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [gym_entries, exFilter]);

  // weekly volume bar
  const weeklyData = useMemo(() => {
    const byWeek = {};
    for (const e of filtered) {
      const d = new Date(e.date);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = `${d.getFullYear()}-W${Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7)}`;
      byWeek[week] = (byWeek[week] || 0) + (e.volume || 0);
    }
    return Object.entries(byWeek)
      .map(([week, vol]) => ({ week, vol: round(vol, 0) }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  // training split donut (sets per primary muscle)
  const splitData = useMemo(() => {
    const byMuscle = {};
    for (const e of filtered) {
      const m = (e.muscles && e.muscles[0]) || MUSCLES_FOR_EXERCISE[e.exercise]?.[0] || "Other";
      byMuscle[m] = (byMuscle[m] || 0) + (Number(e.sets) || 0);
    }
    return Object.entries(byMuscle).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // progress table grouped by exercise, with Δ vs first
  const grouped = useMemo(() => {
    const g = {};
    for (const e of filtered) (g[e.exercise] ||= []).push(e);
    for (const k of Object.keys(g)) g[k].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return g;
  }, [filtered]);

  const del = async (id) => remove("gym_entries", id);

  return (
    <div>
      <PageHeader
        title="Gym"
        subtitle={`${monthVolume.toLocaleString()} kg lifted this month`}
        action={
          <Button onClick={() => setLogging(true)}>
            <Plus size={18} /> Log workout
          </Button>
        }
      />

      {/* filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={personFilter === "All"} onClick={() => setPersonFilter("All")}>
          Everyone
        </Chip>
        {names.map((n) => (
          <Chip key={n} active={personFilter === n} onClick={() => setPersonFilter(n)}>
            {n}
          </Chip>
        ))}
        <div className="ml-auto">
          <Select
            options={["All", ...exercises]}
            value={exFilter}
            onChange={(e) => setExFilter(e.target.value)}
          />
        </div>
      </div>

      {gym_entries.length === 0 ? (
        <Empty emoji="💪">No workouts logged yet — hit "Log workout".</Empty>
      ) : (
        <>
          {/* charts */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-2 font-semibold">
                {exFilter === "All" ? "Pick an exercise to see 1RM trend" : `Est. 1RM — ${exFilter}`}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                {exFilter === "All" ? (
                  <div className="flex h-full items-center justify-center text-ink-soft">
                    <span className="text-sm">Select an exercise above ↑</span>
                  </div>
                ) : (
                  <LineChart data={lineData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="kg" width={44} />
                    <RTooltip />
                    <Legend />
                    {names.map((n, i) => (
                      <Line key={n} type="monotone" dataKey={n} stroke={PALETTE[i]} strokeWidth={2} dot />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="mb-2 font-semibold">Weekly volume (kg)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <RTooltip />
                  <Bar dataKey="vol" fill="#c75b39" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="mb-2 font-semibold">Training split (sets/muscle)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={splitData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {splitData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Trophy size={18} className="text-gold" /> Personal records
              </h3>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {prs.slice(0, 12).map((p) => (
                  <div key={p.who + p.exercise} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{p.exercise}</span>
                    <span className="text-ink-soft">
                      {p.who} · {round(p.best1rm, 1)}kg 1RM · {round(p.bestVol, 0)}kg vol
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* progress table grouped by exercise */}
          <h3 className="mb-3 font-display text-xl font-semibold">Progress log</h3>
          <div className="space-y-5">
            {Object.entries(grouped).map(([ex, rows]) => {
              const first = rows[0];
              return (
                <Card key={ex} className="overflow-hidden">
                  <div className="border-b border-black/5 px-4 py-2.5 font-semibold">{ex}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-ink-soft">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-2">Who</th>
                          <th className="px-2">Weight</th>
                          <th className="px-2">Reps</th>
                          <th className="px-2">Volume</th>
                          <th className="px-2">e1RM</th>
                          <th className="px-2">RPE</th>
                          <th className="px-2">Δ 1RM</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const delta = round((r.e1rm || 0) - (first.e1rm || 0), 1);
                          const up = delta > 0;
                          const down = delta < 0;
                          return (
                            <tr key={r.id} className="border-t border-black/5">
                              <td className="px-4 py-2">{r.date}</td>
                              <td className="px-2">{r.who}</td>
                              <td className="px-2">{r.weight ?? "—"}{r.weight ? "kg" : ""}</td>
                              <td className="px-2">{r.reps ?? "—"}</td>
                              <td className="px-2">{round(r.volume, 0) ?? "—"}</td>
                              <td className="px-2">{round(r.e1rm, 1) ?? "—"}</td>
                              <td className="px-2">{r.rpe ?? "—"}</td>
                              <td className={`px-2 font-semibold ${up ? "text-sage" : down ? "text-red-600" : "text-ink-soft"}`}>
                                {r === first ? "—" : (
                                  <span className="inline-flex items-center gap-0.5">
                                    {up && <TrendingUp size={13} />}
                                    {down && <TrendingDown size={13} />}
                                    {up ? "+" : ""}{delta}
                                  </span>
                                )}
                              </td>
                              <td className="px-2">
                                <button onClick={() => del(r.id)} className="text-ink-soft hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {logging && <Logger names={names} onClose={() => setLogging(false)} add={add} />}
    </div>
  );
}

/* ---------------- cascading logger ---------------- */
function Logger({ names, onClose, add }) {
  const [who, setWho] = useState(names[0] || "");
  const [date, setDate] = useState(todayISO());
  const [session, setSession] = useState("");
  const [muscles, setMuscles] = useState([]);
  const [picked, setPicked] = useState([]); // exercise names
  const [custom, setCustom] = useState("");
  const [entries, setEntries] = useState({}); // exercise -> {sets,reps,weight,rpe,duration,distance}
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const availableExercises = [...new Set(muscles.flatMap((m) => EXERCISES_BY_MUSCLE[m] || []))];

  const toggleMuscle = (m) =>
    setMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const togglePick = (ex) =>
    setPicked((cur) => {
      const next = cur.includes(ex) ? cur.filter((x) => x !== ex) : [...cur, ex];
      setEntries((e) => ({ ...e, [ex]: e[ex] || { sets: "", reps: "", weight: "", rpe: "", duration: "", distance: "" } }));
      return next;
    });

  const addCustom = () => {
    const name = custom.trim();
    if (!name || picked.includes(name)) return;
    setPicked((c) => [...c, name]);
    setEntries((e) => ({ ...e, [name]: { sets: "", reps: "", weight: "", rpe: "", duration: "", distance: "" } }));
    setCustom("");
  };

  const isCardio = (ex) =>
    muscles.includes(CARDIO_MUSCLE) && (EXERCISES_BY_MUSCLE.Cardio.includes(ex) || !MUSCLES_FOR_EXERCISE[ex]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    for (const ex of picked) {
      const v = entries[ex];
      const mus = MUSCLES_FOR_EXERCISE[ex]?.filter((m) => muscles.includes(m)) || muscles;
      const sets = Number(v.sets) || null;
      const reps = Number(v.reps) || null;
      const weight = Number(v.weight) || null;
      await add("gym_entries", {
        date,
        who,
        session: session || null,
        muscles: mus.length ? mus : muscles,
        exercise: ex,
        sets,
        reps,
        weight,
        rpe: v.rpe ? Number(v.rpe) : null,
        duration: v.duration ? Number(v.duration) : duration ? Number(duration) : null,
        distance: v.distance ? Number(v.distance) : null,
        volume: calcVolume(sets, reps, weight),
        e1rm: round(epley1RM(weight, reps), 2),
      });
    }
    setBusy(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Log a workout" wide>
      <form onSubmit={save} className="space-y-5">
        {/* 1. who + date */}
        <div>
          <div className="mb-1.5 text-sm font-semibold text-ink-soft">1 · Who & when</div>
          <div className="flex flex-wrap items-center gap-2">
            {names.map((n) => (
              <Chip key={n} active={who === n} onClick={() => setWho(n)}>
                {n}
              </Chip>
            ))}
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
            <Input placeholder="Session name (e.g. Push Day)" value={session} onChange={(e) => setSession(e.target.value)} className="flex-1" />
          </div>
        </div>

        {/* 2. muscles */}
        <div>
          <div className="mb-1.5 text-sm font-semibold text-ink-soft">2 · Muscle groups</div>
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <Chip key={m} active={muscles.includes(m)} onClick={() => toggleMuscle(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </div>

        {/* 3. exercises */}
        {muscles.length > 0 && (
          <div>
            <div className="mb-1.5 text-sm font-semibold text-ink-soft">3 · Exercises</div>
            <div className="flex flex-wrap gap-2">
              {availableExercises.map((ex) => (
                <Chip key={ex} active={picked.includes(ex)} onClick={() => togglePick(ex)}>
                  {ex}
                </Chip>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Custom exercise…" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <Button type="button" variant="soft" onClick={addCustom}>
                Add
              </Button>
            </div>
          </div>
        )}

        {/* 4. per-exercise inputs */}
        {picked.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-ink-soft">4 · Sets</div>
            {picked.map((ex) => {
              const cardio = isCardio(ex);
              const v = entries[ex] || {};
              const set = (patch) => setEntries((e) => ({ ...e, [ex]: { ...e[ex], ...patch } }));
              return (
                <Card key={ex} className="p-3">
                  <div className="mb-2 font-semibold">{ex}</div>
                  {cardio ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="Duration (min)" value={v.duration} onChange={(e) => set({ duration: e.target.value })} />
                      <Input type="number" placeholder="Distance (km)" value={v.distance} onChange={(e) => set({ distance: e.target.value })} />
                      <Input type="number" placeholder="RPE" value={v.rpe} onChange={(e) => set({ rpe: e.target.value })} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <Input type="number" placeholder="Sets" value={v.sets} onChange={(e) => set({ sets: e.target.value })} />
                      <Input type="number" placeholder="Reps" value={v.reps} onChange={(e) => set({ reps: e.target.value })} />
                      <Input type="number" placeholder="Weight (kg)" value={v.weight} onChange={(e) => set({ weight: e.target.value })} />
                      <Input type="number" placeholder="RPE" value={v.rpe} onChange={(e) => set({ rpe: e.target.value })} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. session */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Session duration (min)">
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || picked.length === 0}>
            {busy ? "Saving…" : "Save workout"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

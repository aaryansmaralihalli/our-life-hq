import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { useData } from "../context/AppData";
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Modal,
  Badge,
  Empty,
  PageHeader,
  Chip,
} from "../components/ui";
import { GENDERS, todayISO } from "../lib/constants";
import {
  bmi,
  bmiCategory,
  bmr,
  tdee,
  navyBodyFat,
  ageFromDob,
  round,
} from "../lib/formulas";

const PALETTE = ["#c75b39", "#b5557a", "#6b7f6e"];

// Enrich a health row with computed values, pulling height/age/gender from profile.
function enrich(row, profile, standard = "icmr") {
  const heightCm = profile?.height_cm;
  const age = ageFromDob(profile?.dob);
  const gender = profile?.gender;
  const bmiVal = bmi(row.weight, heightCm);
  const cat = bmiCategory(bmiVal, standard);
  const bmrVal = bmr({ weightKg: row.weight, heightCm, age, gender });
  const bf =
    row.body_fat != null
      ? row.body_fat
      : navyBodyFat({ gender, heightCm, neck: row.neck, waist: row.waist, hip: row.hip });
  return {
    ...row,
    bmi: round(bmiVal, 1),
    cat,
    bmr: round(bmrVal, 0),
    tdee: round(tdee(bmrVal, profile?.activity_level), 0),
    bodyFat: round(bf, 1),
  };
}

const blank = (who) => ({
  date: todayISO(),
  who,
  weight: "",
  body_fat: "",
  waist: "",
  neck: "",
  hip: "",
  resting_hr: "",
  notes: "",
});

const goalLine = (goal, deltaWeight) => {
  if (deltaWeight == null) return "Log a second weigh-in to see your trend.";
  const moved = round(Math.abs(deltaWeight), 1);
  if (goal === "lose")
    return deltaWeight < 0 ? `Down ${moved} kg — keep it up! 💪` : `Up ${moved} kg since the start — you've got this.`;
  if (goal === "gain")
    return deltaWeight > 0 ? `Up ${moved} kg — strong progress! 💪` : `Down ${moved} kg — small dips are normal.`;
  return `Holding steady within ${moved} kg — nice consistency. ✨`;
};

export default function Health() {
  const { health_entries, people, add, remove } = useData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank(""));
  const [standard, setStandard] = useState("icmr");

  const openNew = () => {
    setForm(blank(people[0]?.name || ""));
    setEditing({});
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      date: form.date,
      who: form.who,
      weight: Number(form.weight),
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      waist: form.waist ? Number(form.waist) : null,
      neck: form.neck ? Number(form.neck) : null,
      hip: form.hip ? Number(form.hip) : null,
      resting_hr: form.resting_hr ? Number(form.resting_hr) : null,
      notes: form.notes,
    };
    await add("health_entries", payload);
    setEditing(null);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Health"
        subtitle="body composition, done properly"
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Log weigh-in
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-2 text-sm">
        <span className="text-ink-soft">BMI standard:</span>
        <Chip active={standard === "icmr"} onClick={() => setStandard("icmr")}>
          ICMR (India)
        </Chip>
        <Chip active={standard === "who"} onClick={() => setStandard("who")}>
          WHO
        </Chip>
      </div>

      {people.map((p, i) => {
        const rows = health_entries
          .filter((r) => r.who === p.name)
          .map((r) => enrich(r, p, standard))
          .sort((a, b) => a.date.localeCompare(b.date));
        if (rows.length === 0)
          return (
            <Card key={p.id} className="mb-5 p-5">
              <div className="mb-1 font-display text-xl font-semibold">{p.name}</div>
              <Empty emoji="⚖️">No weigh-ins yet for {p.name}.</Empty>
            </Card>
          );

        const latest = rows[rows.length - 1];
        const first = rows[0];
        const dWeight = round(latest.weight - first.weight, 1);
        const age = ageFromDob(p.dob);

        return (
          <Card key={p.id} className="mb-5 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-display text-xl font-semibold">{p.name}</span>
                <span className="ml-2 text-sm text-ink-soft">
                  {age ? `${age} yrs · ` : ""}
                  {p.height_cm} cm · goal: {p.goal}
                </span>
              </div>
              <Badge tone={latest.cat.tone}>
                BMI {latest.bmi} · {latest.cat.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Latest weight" value={`${latest.weight} kg`} sub={dWeight === 0 ? "—" : `${dWeight > 0 ? "+" : ""}${dWeight} kg`} />
              <Stat label="BMR" value={`${latest.bmr ?? "—"}`} sub="kcal/day" />
              <Stat label="TDEE" value={`${latest.tdee ?? "—"}`} sub="kcal/day" />
              <Stat label="Body fat" value={latest.bodyFat != null ? `${latest.bodyFat}%` : "—"} sub={latest.body_fat == null && latest.bodyFat != null ? "est. (Navy)" : ""} />
            </div>

            <p className="mt-3 font-display italic text-ink-soft">{goalLine(p.goal, dWeight)}</p>

            {rows.length > 1 && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <MiniChart title="Weight (kg)" data={rows} keys={["weight"]} colors={[PALETTE[i % PALETTE.length]]} />
                <MiniChart title="BMI" data={rows} keys={["bmi"]} colors={["#6b7f6e"]} />
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-soft">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Weight</th>
                    <th>BMI</th>
                    <th>Category</th>
                    <th>Body fat</th>
                    <th>Waist</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.id} className="border-t border-black/5">
                      <td className="py-2">{r.date}</td>
                      <td>{r.weight} kg</td>
                      <td>{r.bmi}</td>
                      <td>
                        <Badge tone={r.cat.tone}>{r.cat.label}</Badge>
                      </td>
                      <td>{r.bodyFat != null ? `${r.bodyFat}%` : "—"}</td>
                      <td>{r.waist ? `${r.waist} cm` : "—"}</td>
                      <td>
                        <button onClick={() => remove("health_entries", r.id)} className="text-ink-soft hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Log a weigh-in" wide>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Who">
              <Select options={people.map((p) => p.name)} value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
            </Field>
            <Field label="Resting HR (bpm)">
              <Input type="number" value={form.resting_hr} onChange={(e) => setForm({ ...form, resting_hr: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs text-ink-soft">
            Height, age & gender come from the profile. Add measurements below to auto-estimate body fat (US-Navy) if you don't enter it directly.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Body fat %">
              <Input type="number" step="0.1" value={form.body_fat} onChange={(e) => setForm({ ...form, body_fat: e.target.value })} />
            </Field>
            <Field label="Waist (cm)">
              <Input type="number" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
            </Field>
            <Field label="Neck (cm)">
              <Input type="number" value={form.neck} onChange={(e) => setForm({ ...form, neck: e.target.value })} />
            </Field>
            <Field label="Hip (cm)">
              <Input type="number" value={form.hip} onChange={(e) => setForm({ ...form, hip: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white/60 p-3">
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-ink-soft">{sub}</div>}
    </div>
  );
}

function MiniChart({ title, data, keys, colors }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-ink-soft">{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} width={40} domain={["auto", "auto"]} />
          <RTooltip />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={2} dot />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

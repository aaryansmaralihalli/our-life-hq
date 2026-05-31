import { useState } from "react";
import { Download, Upload, Sparkles, Trash2, Save } from "lucide-react";
import { useData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { Card, Button, Field, Input, Select, PageHeader, confirmDelete } from "../components/ui";
import { ACTIVITY_LEVELS, GOALS, GENDERS, AVATAR_COLORS } from "../lib/constants";
import { ageFromDob } from "../lib/formulas";
import { exportAll, importAll, TABLES } from "../lib/db";

const SECTIONS = [
  ["bucket_items", "Bucket list"],
  ["food_spots", "Food"],
  ["destinations", "Travel"],
  ["gym_entries", "Gym"],
  ["health_entries", "Health"],
];

export default function Profile() {
  const { people, update, resetTable, loadSamples, refresh } = useData();
  const { cloud, email } = useAuth();

  const doExport = async () => {
    const dump = await exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `our-life-hq-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Importing replaces ALL current data. Continue?")) return;
    const text = await file.text();
    try {
      await importAll(JSON.parse(text));
      await refresh();
      alert("Restored ✓");
    } catch {
      alert("That file couldn't be read as a valid backup.");
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile & Settings" subtitle={cloud ? `signed in as ${email}` : "local mode · this device only"} />

      <div className="grid gap-5 lg:grid-cols-2">
        {people.map((p) => (
          <ProfileCard key={p.id} profile={p} onSave={(patch) => update("profiles", p.id, patch)} />
        ))}
      </div>

      <Card className="mt-5 p-5">
        <h3 className="mb-3 font-display text-xl font-semibold">Data</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={doExport}>
            <Download size={16} /> Export backup
          </Button>
          <label>
            <input type="file" accept="application/json" className="hidden" onChange={doImport} />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white/70 px-4 py-2.5 font-semibold shadow-sm hover:bg-white">
              <Upload size={16} /> Import backup
            </span>
          </label>
          <Button variant="soft" onClick={loadSamples}>
            <Sparkles size={16} /> Load sample data
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-ink-soft">Reset a section</div>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(([table, label]) => (
              <Button
                key={table}
                variant="danger"
                onClick={() => confirmDelete(`all ${label} data`) && resetTable(table)}
              >
                <Trash2 size={15} /> {label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfileCard({ profile, onSave }) {
  const [f, setF] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const set = (patch) => {
    setF((cur) => ({ ...cur, ...patch }));
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    await onSave({
      name: f.name,
      dob: f.dob || null,
      gender: f.gender,
      height_cm: f.height_cm ? Number(f.height_cm) : null,
      weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
      body_fat: f.body_fat ? Number(f.body_fat) : null,
      neck: f.neck ? Number(f.neck) : null,
      waist: f.waist ? Number(f.waist) : null,
      hip: f.hip ? Number(f.hip) : null,
      activity_level: f.activity_level,
      goal: f.goal,
      color: f.color,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white" style={{ background: f.color }}>
            {(f.name || "?")[0]}
          </div>
          <Input value={f.name} onChange={(e) => set({ name: e.target.value })} className="flex-1 font-semibold" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Date of birth${f.dob ? ` (${ageFromDob(f.dob)} yrs)` : ""}`}>
            <Input type="date" value={f.dob || ""} onChange={(e) => set({ dob: e.target.value })} />
          </Field>
          <Field label="Gender">
            <Select options={GENDERS} value={f.gender} onChange={(e) => set({ gender: e.target.value })} />
          </Field>
          <Field label="Height (cm)">
            <Input type="number" value={f.height_cm ?? ""} onChange={(e) => set({ height_cm: e.target.value })} />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" step="0.1" value={f.weight_kg ?? ""} onChange={(e) => set({ weight_kg: e.target.value })} />
          </Field>
          <Field label="Body fat % (optional)">
            <Input type="number" step="0.1" value={f.body_fat ?? ""} onChange={(e) => set({ body_fat: e.target.value })} />
          </Field>
          <Field label="Activity level">
            <Select options={ACTIVITY_LEVELS} value={f.activity_level} onChange={(e) => set({ activity_level: e.target.value })} />
          </Field>
          <Field label="Neck (cm)">
            <Input type="number" value={f.neck ?? ""} onChange={(e) => set({ neck: e.target.value })} />
          </Field>
          <Field label="Waist (cm)">
            <Input type="number" value={f.waist ?? ""} onChange={(e) => set({ waist: e.target.value })} />
          </Field>
          <Field label="Hip (cm)">
            <Input type="number" value={f.hip ?? ""} onChange={(e) => set({ hip: e.target.value })} />
          </Field>
          <Field label="Goal">
            <Select options={GOALS} value={f.goal} onChange={(e) => set({ goal: e.target.value })} />
          </Field>
        </div>

        <Field label="Avatar colour">
          <div className="flex gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ color: c })}
                className={`h-7 w-7 rounded-full ring-2 ${f.color === c ? "ring-ink" : "ring-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        <Button type="submit" className="w-full">
          <Save size={16} /> {saved ? "Saved ✓" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}

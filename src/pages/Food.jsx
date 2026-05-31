import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  ProgressBar,
  Empty,
  PageHeader,
  Chip,
  confirmDelete,
} from "../components/ui";
import { FOOD_STATUSES, todayISO } from "../lib/constants";

const tone = { "Want to try": "neutral", Booked: "low", Conquered: "good" };
const stars = (n) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "—");

const blank = () => ({
  place: "",
  cuisine: "",
  city: "",
  status: "Want to try",
  visited_on: "",
  rating: "",
  cost_for_two: "",
  who: "Both",
  notes: "",
});

export default function Food() {
  const { food_spots, whoOptions, add, update, remove } = useData();
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());

  const total = food_spots.length;
  const conquered = food_spots.filter((f) => f.status === "Conquered").length;
  const pct = total ? Math.round((conquered / total) * 100) : 0;

  const filtered = filter === "All" ? food_spots : food_spots.filter((f) => f.status === filter);

  const openNew = () => {
    setForm(blank());
    setEditing({});
  };
  const openEdit = (row) => {
    setForm({
      ...blank(),
      ...row,
      visited_on: row.visited_on || "",
      rating: row.rating ?? "",
      cost_for_two: row.cost_for_two ?? "",
    });
    setEditing(row);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      visited_on: form.visited_on || null,
      rating: form.rating ? Number(form.rating) : null,
      cost_for_two: form.cost_for_two ? Number(form.cost_for_two) : null,
    };
    if (editing.id) await update("food_spots", editing.id, payload);
    else await add("food_spots", payload);
    setEditing(null);
  };

  const del = async (row) => {
    if (confirmDelete(`"${row.place}"`)) await remove("food_spots", row.id);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Food"
        subtitle="spots to conquer"
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Add spot
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>
            🍜 <b className="text-coral">{conquered}</b> of <b>{total}</b> spots conquered
          </span>
          <span className="text-ink-soft">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {["All", ...FOOD_STATUSES].map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty emoji="🍽️">No spots here yet — add a place to try.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{row.place}</div>
                  <div className="text-xs text-ink-soft">
                    {row.cuisine} · {row.city}
                  </div>
                </div>
                <Badge tone={tone[row.status]}>{row.status}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gold">{stars(row.rating)}</span>
                <span className="text-ink-soft">
                  {row.cost_for_two ? `₹${row.cost_for_two} for two` : ""}
                </span>
              </div>
              {row.notes && <p className="mt-2 text-sm text-ink-soft">{row.notes}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => openEdit(row)} className="text-ink-soft hover:text-coral">
                  <Pencil size={16} />
                </button>
                <button onClick={() => del(row)} className="text-ink-soft hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit spot" : "New spot"}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Place">
            <Input autoFocus value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cuisine">
              <Input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select options={FOOD_STATUSES} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </Field>
            <Field label="Who">
              <Select options={whoOptions} value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} />
            </Field>
            <Field label="Visited on">
              <Input type="date" value={form.visited_on} onChange={(e) => setForm({ ...form, visited_on: e.target.value })} />
            </Field>
            <Field label="Rating (1–5)">
              <Select
                options={["", "1", "2", "3", "4", "5"]}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </Field>
            <Field label="Cost for two (₹)">
              <Input type="number" value={form.cost_for_two} onChange={(e) => setForm({ ...form, cost_for_two: e.target.value })} />
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

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Calendar, LayoutGrid, List as ListIcon, Check } from "lucide-react";
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
  burstConfetti,
} from "../components/ui";
import { BUCKET_CATEGORIES, BUCKET_STATUSES, todayISO } from "../lib/constants";

const statusTone = {
  Idea: "neutral",
  Planned: "low",
  "In Progress": "warn",
  Done: "good",
};
const excitementStars = (n) => "🔥".repeat(n || 0);

const blank = () => ({
  dream: "",
  category: "Experience",
  who: "Both",
  status: "Idea",
  target_date: "",
  done_date: null,
  excitement: 2,
  notes: "",
});

export default function BucketList() {
  const { bucket_items, whoOptions, add, update, remove } = useData();
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null); // row or {} for new
  const [form, setForm] = useState(blank());

  const total = bucket_items.length;
  const done = bucket_items.filter((b) => b.status === "Done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const openNew = () => {
    setForm(blank());
    setEditing({});
  };
  const openEdit = (row) => {
    setForm({ ...blank(), ...row, target_date: row.target_date || "" });
    setEditing(row);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      target_date: form.target_date || null,
      excitement: Number(form.excitement),
    };
    if (editing.id) await update("bucket_items", editing.id, payload);
    else await add("bucket_items", payload);
    setEditing(null);
  };

  const setStatus = async (row, status, ev) => {
    const patch = { status };
    if (status === "Done") {
      patch.done_date = row.done_date || todayISO();
      if (ev) burstConfetti(ev.clientX, ev.clientY);
    }
    await update("bucket_items", row.id, patch);
  };

  const del = async (row) => {
    if (confirmDelete(`"${row.dream}"`)) await remove("bucket_items", row.id);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Bucket List"
        subtitle="dreams to chase, together"
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Add dream
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>
            <b className="text-coral">{done}</b> of <b>{total}</b> dreams fulfilled
          </span>
          <span className="text-ink-soft">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </Card>

      <div className="mb-5 flex gap-2">
        <Chip active={view === "list"} onClick={() => setView("list")}>
          <ListIcon size={14} className="mr-1 inline" /> List
        </Chip>
        <Chip active={view === "board"} onClick={() => setView("board")}>
          <LayoutGrid size={14} className="mr-1 inline" /> Board
        </Chip>
        <Chip active={view === "calendar"} onClick={() => setView("calendar")}>
          <Calendar size={14} className="mr-1 inline" /> Upcoming
        </Chip>
      </div>

      {total === 0 && <Empty emoji="🎯">No dreams yet — add your first ✨</Empty>}

      {view === "list" && (
        <div className="space-y-3">
          {bucket_items.map((row) => (
            <DreamRow key={row.id} row={row} onEdit={openEdit} onDel={del} onStatus={setStatus} />
          ))}
        </div>
      )}

      {view === "board" && (
        <div className="grid gap-4 md:grid-cols-4">
          {BUCKET_STATUSES.map((st) => (
            <div key={st}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <Badge tone={statusTone[st]}>{st}</Badge>
                <span className="text-xs text-ink-soft">
                  {bucket_items.filter((b) => b.status === st).length}
                </span>
              </div>
              <div className="space-y-3">
                {bucket_items
                  .filter((b) => b.status === st)
                  .map((row) => (
                    <Card key={row.id} className="p-3.5">
                      <div className="font-semibold">{row.dream}</div>
                      <div className="mt-1 text-xs text-ink-soft">
                        {row.category} · {row.who} {excitementStars(row.excitement)}
                      </div>
                      <div className="mt-2 flex gap-1">
                        <button onClick={() => openEdit(row)} className="text-ink-soft hover:text-coral">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => del(row)} className="text-ink-soft hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "calendar" && (
        <div className="space-y-3">
          {bucket_items
            .filter((b) => b.target_date && b.status !== "Done")
            .sort((a, b) => a.target_date.localeCompare(b.target_date))
            .map((row) => (
              <Card key={row.id} className="flex items-center gap-4 p-4">
                <div className="w-28 shrink-0 font-display text-sm italic text-coral">
                  {new Date(row.target_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="flex-1 font-semibold">{row.dream}</div>
                <Badge tone={statusTone[row.status]}>{row.status}</Badge>
              </Card>
            ))}
          {bucket_items.filter((b) => b.target_date && b.status !== "Done").length === 0 && (
            <Empty emoji="📅">No upcoming dreams have target dates yet.</Empty>
          )}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit dream" : "New dream"}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Dream">
            <Input
              autoFocus
              value={form.dream}
              onChange={(e) => setForm({ ...form, dream: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                options={BUCKET_CATEGORIES}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Who">
              <Select
                options={whoOptions}
                value={form.who}
                onChange={(e) => setForm({ ...form, who: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                options={BUCKET_STATUSES}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </Field>
            <Field label="Target date">
              <Input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label={`Excitement ${excitementStars(Number(form.excitement))}`}>
            <input
              type="range"
              min="1"
              max="3"
              value={form.excitement}
              onChange={(e) => setForm({ ...form, excitement: e.target.value })}
              className="w-full accent-coral"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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

function DreamRow({ row, onEdit, onDel, onStatus }) {
  const isDone = row.status === "Done";
  return (
    <Card className="flex items-center gap-3 p-4">
      <button
        onClick={(e) => onStatus(row, isDone ? "In Progress" : "Done", e)}
        title={isDone ? "Mark as not done" : "Mark as done"}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${
          isDone ? "border-sage bg-sage text-white" : "border-coral text-transparent hover:bg-coral/10"
        }`}
      >
        <Check size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate font-semibold ${isDone ? "text-ink-soft line-through" : ""}`}>
          {row.dream}
        </div>
        <div className="mt-0.5 text-xs text-ink-soft">
          {row.category} · {row.who} {excitementStars(row.excitement)}
          {row.target_date && !isDone && (
            <> · 🎯 {new Date(row.target_date).toLocaleDateString()}</>
          )}
          {isDone && row.done_date && (
            <> · ✅ {new Date(row.done_date).toLocaleDateString()}</>
          )}
        </div>
      </div>
      {!isDone && <Badge tone={statusTone[row.status]}>{row.status}</Badge>}
      <button onClick={() => onEdit(row)} className="text-ink-soft hover:text-coral">
        <Pencil size={16} />
      </button>
      <button onClick={() => onDel(row)} className="text-ink-soft hover:text-red-600">
        <Trash2 size={16} />
      </button>
    </Card>
  );
}

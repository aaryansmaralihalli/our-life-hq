import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Calendar, LayoutGrid, List as ListIcon, Check, Image as ImageIcon } from "lucide-react";
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
  StatusPicker,
  confirmDelete,
  burstConfetti,
} from "../components/ui";
import { AnimatedNumber } from "../components/motion";
import PhotoUploader from "../components/PhotoUploader";
import { PhotoStrip } from "../components/PhotoStrip";
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
  photos: [],
});

export default function BucketList() {
  const { bucket_items, whoOptions, add, update, remove } = useData();
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());

  const total = bucket_items.length;
  const done = bucket_items.filter((b) => b.status === "Done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const openNew = () => {
    setForm(blank());
    setEditing({});
  };
  const openEdit = (row) => {
    setForm({ ...blank(), ...row, target_date: row.target_date || "", photos: row.photos || [] });
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
      if (ev) burstConfetti(ev.clientX ?? window.innerWidth / 2, ev.clientY ?? 200);
    }
    await update("bucket_items", row.id, patch);
  };

  const del = async (row) => {
    if (confirmDelete(`"${row.dream}"`)) await remove("bucket_items", row.id);
  };

  return (
    <div>
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
            <AnimatedNumber value={done} className="text-coral text-lg font-bold" /> of {total} dreams fulfilled
          </span>
          <span className="text-ink-soft">
            <AnimatedNumber value={pct} />%
          </span>
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
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {bucket_items.map((row) => (
              <DreamRow key={row.id} row={row} onEdit={openEdit} onDel={del} onStatus={setStatus} />
            ))}
          </AnimatePresence>
        </motion.div>
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
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {bucket_items
                    .filter((b) => b.status === st)
                    .map((row) => (
                      <motion.div
                        layout
                        key={row.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Card className="p-3.5">
                          <div className="font-semibold">{row.dream}</div>
                          <div className="mt-1 text-xs text-ink-soft">
                            {row.category} · {row.who} {excitementStars(row.excitement)}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <StatusPicker
                              value={row.status}
                              options={BUCKET_STATUSES}
                              tones={statusTone}
                              onChange={(s) => setStatus(row, s)}
                            />
                            <button onClick={() => openEdit(row)} className="ml-auto text-ink-soft hover:text-coral">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => del(row)} className="text-ink-soft hover:text-red-600">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>
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
                <StatusPicker value={row.status} options={BUCKET_STATUSES} tones={statusTone} onChange={(s) => setStatus(row, s)} />
              </Card>
            ))}
          {bucket_items.filter((b) => b.target_date && b.status !== "Done").length === 0 && (
            <Empty emoji="📅">No upcoming dreams have target dates yet.</Empty>
          )}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit dream" : "New dream"} wide>
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
              <Select options={whoOptions} value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} />
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
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label="📷 Photo memories">
            <PhotoUploader
              photos={form.photos}
              folder="bucket"
              onChange={(photos) => setForm({ ...form, photos })}
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
  const photos = row.photos || [];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => onStatus(row, isDone ? "In Progress" : "Done", e)}
            title={isDone ? "Mark as not done" : "Mark as done"}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${
              isDone ? "border-sage bg-sage text-white" : "border-coral text-transparent hover:bg-coral/10"
            }`}
          >
            <Check size={16} />
          </motion.button>
          <div className="min-w-0 flex-1">
            <div className={`truncate font-semibold ${isDone ? "text-ink-soft line-through" : ""}`}>
              {row.dream}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
              <span>{row.category} · {row.who} {excitementStars(row.excitement)}</span>
              {photos.length > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  · <ImageIcon size={11} /> {photos.length}
                </span>
              )}
              {row.target_date && !isDone && <span>· 🎯 {new Date(row.target_date).toLocaleDateString()}</span>}
              {isDone && row.done_date && <span>· ✅ {new Date(row.done_date).toLocaleDateString()}</span>}
            </div>
          </div>
          <StatusPicker value={row.status} options={BUCKET_STATUSES} tones={statusTone} onChange={(s) => onStatus(row, s)} />
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button onClick={() => onEdit(row)} className="text-ink-soft hover:text-coral">
              <Pencil size={16} />
            </button>
            <button onClick={() => onDel(row)} className="text-ink-soft hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {photos.length > 0 && <PhotoStrip photos={photos} className="mt-3" />}
      </Card>
    </motion.div>
  );
}

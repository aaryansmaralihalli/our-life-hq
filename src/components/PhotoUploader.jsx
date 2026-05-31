import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadPhoto, removePhoto, photoUrl } from "../lib/photos";

/* A single thumbnail that resolves its (possibly signed) URL lazily. */
function Thumb({ refStr, onDelete, index }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    photoUrl(refStr).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [refStr]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group/photo relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl shadow-md"
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover transition group-hover/photo:scale-110" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-black/5">
          <Loader2 size={18} className="animate-spin text-ink-soft" />
        </div>
      )}
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover/photo:opacity-100 hover:bg-black/80"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function PhotoUploader({ photos = [], onChange, folder = "misc", label = "Add photos" }) {
  const [busy, setBusy] = useState(false);

  const add = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    const next = [...photos];
    for (const f of files) {
      const ref = await uploadPhoto(f, folder);
      if (ref) next.push(ref);
    }
    setBusy(false);
    onChange(next);
  };

  const del = async (index) => {
    const ref = photos[index];
    onChange(photos.filter((_, i) => i !== index));
    await removePhoto(ref);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <AnimatePresence mode="popLayout">
          {photos.map((p, i) => (
            <Thumb key={p} refStr={p} index={i} onDelete={del} />
          ))}
        </AnimatePresence>

        <motion.label
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-coral/40 text-coral transition hover:border-coral hover:bg-coral/5"
        >
          {busy ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <div className="text-center">
              <ImagePlus size={22} className="mx-auto" />
              <span className="mt-1 block text-[10px] font-semibold leading-tight">{label}</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => add(e.target.files)}
          />
        </motion.label>
      </div>
    </div>
  );
}

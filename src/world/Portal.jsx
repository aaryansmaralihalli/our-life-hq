import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useData } from "../context/AppData";
import { photoUrl } from "../lib/photos";

/* The Nether portal: a glowing purple frame that, when open, shows your real
   photos drifting inside. Pure CSS/DOM (no WebGL needed) so it stays light and
   layers cleanly over the character canvases. */
export default function Portal({ open, onClose }) {
  const { bucket_items, food_spots, destinations } = useData();
  const [urls, setUrls] = useState([]);
  const [zoom, setZoom] = useState(null);

  // collect every photo ref across sections
  const refs = useMemo(() => {
    const all = [];
    for (const row of [...bucket_items, ...food_spots, ...destinations]) {
      if (Array.isArray(row.photos)) all.push(...row.photos);
    }
    return all;
  }, [bucket_items, food_spots, destinations]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    Promise.all(refs.map((r) => photoUrl(r))).then((list) => {
      if (alive) setUrls(list.filter(Boolean));
    });
    return () => {
      alive = false;
    };
  }, [open, refs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 grid place-items-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          {/* portal frame */}
          <motion.div
            initial={{ scale: 0.2, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="portal-frame relative h-[80vh] w-[min(92vw,720px)] overflow-hidden rounded-[120px/90px]"
          >
            <div className="portal-swirl absolute inset-0" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"
            >
              <X size={20} />
            </button>

            <div className="relative z-[1] flex h-full items-center justify-center p-8">
              {urls.length === 0 ? (
                <p className="text-center font-display text-lg italic text-purple-100">
                  No memories captured yet.
                  <br />
                  Add photos to your dreams, meals & trips —
                  <br />
                  they'll drift here. ✨
                </p>
              ) : (
                <div className="grid max-h-full w-full grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
                  {urls.map((u, i) => (
                    <motion.img
                      key={u + i}
                      src={u}
                      onClick={() => setZoom(u)}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        y: [0, -6, 0],
                        scale: 1,
                      }}
                      transition={{
                        opacity: { delay: i * 0.05 },
                        scale: { delay: i * 0.05, type: "spring" },
                        y: { duration: 3 + (i % 4), repeat: Infinity, ease: "easeInOut" },
                      }}
                      className="aspect-square w-full cursor-pointer rounded-xl object-cover shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* lightbox */}
          <AnimatePresence>
            {zoom && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setZoom(null)}
                className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-6"
              >
                <motion.img
                  src={zoom}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="max-h-[88vh] max-w-full rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

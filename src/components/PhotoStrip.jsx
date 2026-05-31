import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { photoUrl } from "../lib/photos";

/* Read-only row of thumbnails that resolve their URLs lazily, with a
   lightbox on click. Used on cards to show saved photos. */
function Thumb({ refStr, onClick }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    photoUrl(refStr).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [refStr]);
  return (
    <motion.button
      type="button"
      onClick={() => src && onClick(src)}
      whileHover={{ scale: 1.06, zIndex: 1 }}
      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5 shadow-sm"
    >
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    </motion.button>
  );
}

export function PhotoStrip({ photos = [], className = "" }) {
  const [lightbox, setLightbox] = useState(null);
  if (!photos.length) return null;
  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {photos.map((p) => (
          <Thumb key={p} refStr={p} onClick={setLightbox} />
        ))}
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-6 backdrop-blur"
          >
            <motion.img
              src={lightbox}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="max-h-[88vh] max-w-full rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

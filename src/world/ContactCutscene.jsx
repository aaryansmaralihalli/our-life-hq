import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/* Plays when the two characters come into contact:
   1. a quick white flash + "burst of hearts" transition
   2. then a fullscreen video (drop your file at public/contact.mp4)
   Closes on video end, on tap, or on the X. Gracefully shows a fallback
   message if the video file isn't present yet. */
const VIDEO_SRC = "/contact.mp4"; // ← add this file to the public/ folder

export default function ContactCutscene({ open, onClose }) {
  const videoRef = useRef(null);
  const [phase, setPhase] = useState("flash"); // flash → video
  const [videoOk, setVideoOk] = useState(true);
  const [needTap, setNeedTap] = useState(false); // mobile autoplay was blocked

  useEffect(() => {
    if (!open) return;
    setPhase("flash");
    setVideoOk(true);
    setNeedTap(false);
    const t = setTimeout(() => setPhase("video"), 900);
    return () => clearTimeout(t);
  }, [open]);

  // Mobile (iOS/Android) blocks programmatic play() outside a tap gesture.
  // Strategy: start MUTED (muted autoplay is allowed on mobile); if even that
  // is blocked, show a tap-to-play button. Unmute once it's actually playing.
  useEffect(() => {
    const v = videoRef.current;
    if (phase !== "video" || !v) return;
    v.muted = true;
    v.play()
      .then(() => {
        // playing — try to unmute (may be ignored on some devices, that's ok)
        v.muted = false;
      })
      .catch(() => setNeedTap(true));
  }, [phase]);

  const tapToPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().then(() => setNeedTap(false)).catch(() => {});
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black"
          onClick={phase === "video" ? onClose : undefined}
        >
          {/* phase 1: white flash + floating hearts */}
          <AnimatePresence>
            {phase === "flash" && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.2, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, times: [0, 0.25, 0.5, 1] }}
                className="absolute inset-0 grid place-items-center bg-white"
              >
                <motion.div
                  initial={{ scale: 0.2, rotate: -20 }}
                  animate={{ scale: [0.2, 1.4, 1], rotate: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-7xl"
                >
                  💖
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* phase 2: the video */}
          {phase === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 grid place-items-center"
            >
              {videoOk ? (
                <>
                  {/* viewport-constrained so the portrait clip always fits, no crop/stretch */}
                  <video
                    ref={videoRef}
                    src={VIDEO_SRC}
                    className="object-contain"
                    style={{ maxHeight: "100vh", maxWidth: "100vw", height: "auto", width: "auto" }}
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    onEnded={onClose}
                    onError={() => setVideoOk(false)}
                  />
                  {/* mobile fallback: tap to play (if autoplay was blocked) */}
                  {needTap && (
                    <button
                      onClick={tapToPlay}
                      className="absolute inset-0 grid place-items-center bg-black/40"
                    >
                      <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-3xl shadow-xl">
                        ▶
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <div className="grid h-full w-full place-items-center p-8 text-center">
                  <div>
                    <div className="mb-3 text-6xl">🎬💞</div>
                    <p className="font-display text-2xl text-white">
                      Your moment goes here
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Add a video at <code>public/contact.mp4</code> and it'll
                      play when you two meet.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

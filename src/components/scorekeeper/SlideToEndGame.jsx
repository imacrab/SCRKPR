import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { SPRING_POP, SPRING_SNAPPY } from "@/lib/motion";
import FluentEmoji from "./FluentEmoji";

const KNOB = 48; // knob diameter (px) — also the track height
const PAD = 4; // track inner padding = the gradient stroke width

/**
 * Slide-to-confirm End Game control. Drag the flag knob across the track;
 * the whole pill scales 1 → 1.1 with progress. A completed slide springs
 * everything back (bouncy) and fires onComplete (opens the End Game modal).
 * A released partial slide just springs the knob home.
 */
export default function SlideToEndGame({ onComplete }) {
  const trackRef = useRef(null);
  const [maxX, setMaxX] = useState(0);
  const x = useMotionValue(0);

  // How far the knob can travel: inner track width minus the knob itself.
  useLayoutEffect(() => {
    const measure = () =>
      setMaxX(Math.max(0, (trackRef.current?.clientWidth ?? 0) - KNOB));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Whole-pill scale follows slide progress; label fades out ahead of the knob.
  const scale = useTransform(x, [0, maxX || 1], [1, 1.1]);
  const labelOpacity = useTransform(x, [0, (maxX || 1) * 0.6], [1, 0]);
  // Stroke crossfades gradient → white, and the track fills white behind the
  // knob (fill trails the knob's right edge, so the knob "paints" it in).
  const strokeWhite = useTransform(x, [0, maxX || 1], [0, 1]);
  const fillWidth = useTransform(x, (v) => v + KNOB);
  // "Release" hint fades in as the knob nears the completion threshold.
  const releaseOpacity = useTransform(x, [(maxX || 1) * 0.65, (maxX || 1) * 0.95], [0, 1]);

  const handleDragEnd = () => {
    const complete = maxX > 0 && x.get() >= maxX * 0.92;
    // Springing x home also bounces the derived scale back to 1.
    animate(x, 0, complete ? SPRING_POP : SPRING_SNAPPY);
    if (complete) onComplete();
  };

  return (
    <motion.div className="relative w-full max-w-[320px] rounded-full p-1 overflow-hidden" style={{ scale }}>
      {/* Flowing brand gradient — visible only as the stroke around the ink
          fill (the inner track is inset by the p-1 padding). */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "linear-gradient(110deg, #2DC5F8 0%, #6366F1 22%, #A855F7 48%, #FF3A3A 74%, #2DC5F8 100%)",
          backgroundSize: "220% 100%",
        }}
        animate={{ backgroundPosition: ["0% 50%", "220% 50%"] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      />
      {/* White stroke — crossfades in over the gradient as the slide progresses. */}
      <motion.span aria-hidden="true" className="absolute inset-0 bg-white" style={{ opacity: strokeWhite }} />
      {/* Ink track — the app background, so the control reads as a glowing
          gradient outline. */}
      <div ref={trackRef} className="relative rounded-full bg-background overflow-hidden" style={{ height: KNOB }}>
        {/* White fill sweeping in behind the knob */}
        <motion.div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 rounded-full bg-white"
          style={{ width: fillWidth }}
        />
        {/* mix-blend difference keeps the label legible as the white fill
            sweeps under it (white text inverts to ink over the fill). */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-base font-bold text-white tracking-wide select-none"
          style={{ opacity: labelOpacity, mixBlendMode: "difference" }}
        >
          Slide to End Game
        </motion.span>
        {/* Same difference blend — reads as ink over the white fill. */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-base font-bold text-white tracking-wide select-none"
          style={{ opacity: releaseOpacity, mixBlendMode: "difference" }}
        >
          Release to End Game
        </motion.span>
        {/* Flag knob — the drag handle */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.94 }}
          style={{ x, width: KNOB, height: KNOB }}
          className="absolute left-0 top-0 flex items-center justify-center rounded-full bg-white cursor-grab active:cursor-grabbing"
        >
          {/* Same playful pop the streak/emoji flourishes use across the app */}
          <motion.span
            className="flex"
            animate={{ scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <FluentEmoji emoji="🏁" size={22} />
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

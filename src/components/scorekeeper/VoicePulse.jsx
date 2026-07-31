import { motion } from "framer-motion";

/**
 * Subtle "ebb and flow" ambient pulse for the Home Screen.
 *
 * Three overlapping soft-blur discs of the brand blue that gently breathe at
 * different tempos, phases, AND asymmetric X/Y scales — so the blobs morph
 * (squish taller then wider) rather than uniformly pulsing. Combined with
 * a slow drift, the interference pattern never repeats cleanly and reads
 * as organic rather than looping.
 *
 * Pointer-events are disabled so this can sit behind any interactive UI.
 * Sizing/position is controlled by the parent via className / style so it
 * can be placed as a full-container background or a smaller focal glow.
 */
export default function VoicePulse({ className = "", style = {}, color = "#2DC5F8" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Outer, slowest breath — big, diffuse, drifts on a wide orbit. */}
      <motion.div
        style={{
          position: "absolute",
          width: "85%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 45%, transparent 72%)`,
          filter: "blur(32px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [0.95, 1.08, 0.98, 1.05, 0.95],
          scaleY: [1.03, 0.94, 1.08, 0.97, 1.03],
          x: ["-6%", "4%", "-2%", "5%", "-6%"],
          y: ["3%", "-4%", "2%", "-5%", "3%"],
          opacity: [0.55, 0.75, 0.6, 0.7, 0.55],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Mid, medium breath — different phase, drifts the other way. */}
      <motion.div
        style={{
          position: "absolute",
          width: "62%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}88 0%, ${color}33 48%, transparent 74%)`,
          filter: "blur(24px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [1.04, 0.93, 1.07, 0.96, 1.04],
          scaleY: [0.94, 1.06, 0.95, 1.08, 0.94],
          x: ["4%", "-5%", "3%", "-3%", "4%"],
          y: ["-3%", "4%", "-5%", "2%", "-3%"],
          opacity: [0.65, 0.5, 0.75, 0.55, 0.65],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner, quickest breath — brighter core, subtle wander. */}
      <motion.div
        style={{
          position: "absolute",
          width: "42%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}aa 0%, ${color}44 50%, transparent 76%)`,
          filter: "blur(16px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [1.02, 0.96, 1.06, 0.98, 1.02],
          scaleY: [0.98, 1.04, 0.95, 1.06, 0.98],
          x: ["-2%", "3%", "-4%", "2%", "-2%"],
          y: ["2%", "-3%", "3%", "-4%", "2%"],
          opacity: [0.7, 0.55, 0.8, 0.6, 0.7],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
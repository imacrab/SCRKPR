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
          width: "140%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 45%, transparent 72%)`,
          filter: "blur(48px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [0.95, 1.15, 1.0, 1.1, 0.95],
          scaleY: [1.08, 0.92, 1.15, 0.97, 1.08],
          x: ["-12%", "8%", "-4%", "10%", "-12%"],
          y: ["6%", "-8%", "4%", "-10%", "6%"],
          opacity: [0.55, 0.8, 0.6, 0.75, 0.55],
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
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}88 0%, ${color}33 48%, transparent 74%)`,
          filter: "blur(36px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [1.06, 0.9, 1.12, 0.94, 1.06],
          scaleY: [0.92, 1.1, 0.94, 1.14, 0.92],
          x: ["8%", "-10%", "6%", "-6%", "8%"],
          y: ["-6%", "8%", "-10%", "4%", "-6%"],
          opacity: [0.7, 0.5, 0.8, 0.55, 0.7],
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
          width: "70%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}aa 0%, ${color}44 50%, transparent 76%)`,
          filter: "blur(24px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scaleX: [1.04, 0.94, 1.1, 0.96, 1.04],
          scaleY: [0.96, 1.08, 0.93, 1.1, 0.96],
          x: ["-4%", "6%", "-8%", "4%", "-4%"],
          y: ["4%", "-6%", "6%", "-8%", "4%"],
          opacity: [0.75, 0.55, 0.85, 0.6, 0.75],
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
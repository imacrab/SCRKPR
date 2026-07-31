import { motion } from "framer-motion";

/**
 * Subtle "ebb and flow" ambient pulse for the Home Screen.
 *
 * Two overlapping soft-blur discs of the brand blue that gently breathe at
 * different tempos and phases — a slow interference pattern that never
 * repeats cleanly, so the eye reads it as organic rather than looping.
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
        ...style,
      }}
    >
      {/* Outer, slower breath — larger, softer, more diffuse. */}
      <motion.div
        style={{
          position: "absolute",
          width: "80%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 45%, transparent 72%)`,
          filter: "blur(28px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scale: [0.95, 1.06, 0.98, 1.04, 0.95],
          opacity: [0.55, 0.75, 0.6, 0.7, 0.55],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner, faster breath — brighter core, tighter scale range. */}
      <motion.div
        style={{
          position: "absolute",
          width: "52%",
          aspectRatio: "1 / 1",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}99 0%, ${color}44 50%, transparent 75%)`,
          filter: "blur(18px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scale: [1.02, 0.96, 1.05, 0.98, 1.02],
          opacity: [0.7, 0.55, 0.8, 0.6, 0.7],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
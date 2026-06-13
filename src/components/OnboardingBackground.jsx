import { motion, useTransform, useReducedMotion } from "framer-motion";

// ─── Living gradient field for the FTUE ──────────────────────────────────────
// Soft, heavily-blurred color blobs that drift on their own (organic, slow,
// mirrored loops so they never snap), shift palette per slide, parallax with
// the swipe gesture, and bloom a ripple wherever you tap. All transform/opacity
// /color animation → GPU-composited, smooth on a phone. Honors reduced-motion.
//
// Props:
//   step    — current slide index (drives the palette)
//   swipeX  — a framer MotionValue tracking the live drag offset (parallax)
//   ripples — [{ id, x, y }] tap blooms; removed via onRippleDone
//   accent  — current slide's ripple color

// Per-slide palettes — echo each slide's content.
//  0 welcome: brand blue + violet/teal       1 players: the chip colors
//  2 score:   blue + crown gold + red
const PALETTES = [
  ["#2DC5F8", "#6366F1", "#14B8A6", "#3B82F6"],
  ["#2DC5F8", "#A855F7", "#22C55E", "#F97316"],
  ["#2DC5F8", "#EAB308", "#FF3A3A", "#F59E0B"],
];

// Base placement + independent drift paths for each blob. Big + soft + slow:
// oversized blooms (some bleed past the edges), generous drift, long mirrored
// loops so the field feels like it's gently breathing — "whoa," but calm.
const BLOBS = [
  { size: 680, left: "-8%", top: "-2%", dx: [0, 60, -30, 0], dy: [0, -46, 30, 0], dur: [28, 34], parallax: 44 },
  { size: 780, left: "48%", top: "-12%", dx: [0, -70, 34, 0], dy: [0, 42, -20, 0], dur: [36, 30], parallax: 24 },
  { size: 620, left: "18%", top: "40%", dx: [0, 44, -56, 0], dy: [0, 56, 16, 0], dur: [31, 39], parallax: 38 },
  { size: 560, left: "56%", top: "50%", dx: [0, -46, 40, 0], dy: [0, -30, -56, 0], dur: [40, 26], parallax: 18 },
];

// Soft, enveloping blur — the bigger this is, the calmer/dreamier the field.
const BLUR_PX = 120;

function Blob({ cfg, color, swipeX, reduce }) {
  // Parallax: drag the field opposite the swipe, depth varies per blob.
  const px = useTransform(swipeX, [-220, 220], [cfg.parallax, -cfg.parallax]);
  const drift = reduce
    ? {}
    : { x: cfg.dx, y: cfg.dy };
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: cfg.left,
        top: cfg.top,
        width: cfg.size,
        height: cfg.size,
        translateX: px, // parallax composes on top of the drift x/y
        borderRadius: "50%",
        background: "radial-gradient(circle at center, currentColor 0%, transparent 70%)",
        filter: `blur(${BLUR_PX}px)`,
        mixBlendMode: "screen",
        willChange: "transform",
      }}
      animate={{ ...drift, color }}
      transition={{
        x: { duration: cfg.dur[0], repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        y: { duration: cfg.dur[1], repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        color: { duration: 1.1, ease: "easeInOut" },
      }}
    />
  );
}

export default function OnboardingBackground({ step, swipeX, ripples = [], accent = "#2DC5F8", onRippleDone }) {
  const reduce = useReducedMotion();
  const palette = PALETTES[step] ?? PALETTES[0];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Drifting color field */}
      <div className="absolute inset-0" style={{ opacity: 0.7 }}>
        {BLOBS.map((cfg, i) => (
          <Blob key={i} cfg={cfg} color={palette[i]} swipeX={swipeX} reduce={reduce} />
        ))}
      </div>

      {/* Tap ripples — a bloom from the touch point */}
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          initial={{ scale: 0.2, opacity: 0.5 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.95, ease: "easeOut" }}
          onAnimationComplete={() => onRippleDone?.(r.id)}
          style={{
            position: "absolute",
            left: r.x - 110,
            top: r.y - 110,
            width: 220,
            height: 220,
            borderRadius: "50%",
            color: accent,
            background: "radial-gradient(circle at center, currentColor 0%, transparent 60%)",
            filter: "blur(10px)",
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* Subtle vignette so the content stays legible over the glow */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 40%, hsl(var(--background) / 0.55) 100%)" }}
      />
    </div>
  );
}

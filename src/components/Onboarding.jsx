import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import FluentEmoji from "@/components/scorekeeper/FluentEmoji";
import OnboardingBackground from "@/components/OnboardingBackground";
import { SPRING_SHEET, SPRING_SNAPPY, SPRING_POP, DUR_MEDIUM } from "@/lib/motion";
import { setOnboarded } from "@/lib/onboarding";
import logoDark from "@/assets/SCRKPR_dark_mode.png";

// ─── First-time user experience ──────────────────────────────────────────────
// Shown once on first launch (gated in App.jsx). The SCRKPR logo lives in a
// persistent top header across all slides, then morphs into the home-screen
// logo slot when the flow completes. Three slides: who we are → set up players
// → keep score. Swipeable, living gradient background, progress dots + CTA.

// A number that counts up from 0 to `to` — the app's score-pop energy. Starts
// when `play` flips true so it stays in sync with the card's entrance.
function CountUp({ to, color, size = "text-lg", delay = 0, duration = 1.0, play = true }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (!play) return;
    const controls = animate(mv, to, { duration, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, to, delay, duration, play]);
  return (
    <motion.span className={`${size} font-bold tabular-nums`} style={{ color }}>
      {rounded}
    </motion.span>
  );
}

// Welcome hero — choreographed CASCADE: the centered octopus starts counting to
// 24; while it's still climbing the monkey pops in counting to 19, then the fox
// (12), then the frog (8) — counts overlapping in real time, shorter for smaller
// numbers so they all land together. Crown is presented LAST. Layout is composed,
// not random: the three satellites sit balanced around the hero (top-left,
// top-right, bottom-center) so it reads intentional.
const STACK = [
  // Hero: centered on the text axis, crowned leader. Starts the cascade.
  { emoji: "🐙", color: "#A855F7", score: 24, centered: true, rotate: -5, z: 4, delay: 0.3, countDur: 1.0, leader: true },
  // Each slides up + pops into place, boom-boom-boom, while the previous is
  // still counting. Arranged around the hero: monkey top-right, fox top-left,
  // frog bottom-center.
  { emoji: "🐵", color: "#F97316", score: 19, left: "60%", top: "-4%", rotate: 8, z: 2, delay: 0.62, countDur: 0.9 },
  { emoji: "🦊", color: "#2DC5F8", score: 12, left: "2%", top: "-4%", rotate: -8, z: 3, delay: 0.9, countDur: 0.8 },
  { emoji: "🐸", color: "#22C55E", score: 8, left: "30%", top: "70%", rotate: -3, z: 1, delay: 1.15, countDur: 0.7 },
];
const CROWN_DELAY = 2.1; // presented last, after every card has settled

function ScoreChip({ c, play }) {
  // Every card slides UP and POPS into its resting tilted spot — confetti
  // landing in the DOM, one after another (SPRING_SNAPPY for the springy launch).
  // The hero pops a touch more gently; the satellites burst in harder.
  const enter = c.centered
    ? {
        hidden: { opacity: 0, y: 38, scale: 0.8, rotate: c.rotate * 0.5 },
        show: { opacity: 1, y: 0, scale: 1, rotate: c.rotate },
      }
    : {
        hidden: { opacity: 0, y: 44, scale: 0.65, rotate: c.rotate * 0.4 },
        show: { opacity: 1, y: 0, scale: 1, rotate: c.rotate },
      };

  return (
    <motion.div
      // Centered hero rides the flex center; the rest are absolutely scattered.
      className={c.centered ? "relative" : "absolute"}
      style={c.centered ? { zIndex: c.z } : { left: c.left, top: c.top, zIndex: c.z }}
      // Driven by `play` (flipped one frame after mount) rather than mount-initial,
      // which AnimatePresence initial={false} would otherwise suppress.
      initial={false}
      animate={play ? enter.show : enter.hidden}
      transition={{ ...SPRING_SNAPPY, delay: c.delay }}
    >
      <div className="relative inline-flex items-center gap-3 h-12 rounded-2xl border border-border bg-card pl-2 pr-4 shadow-xl shadow-black/40">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: c.color }}
        >
          <FluentEmoji emoji={c.emoji} size={20} />
        </div>
        <CountUp to={c.score} color={c.color} delay={c.delay + 0.1} duration={c.countDur} play={play} />
        {c.leader && (
          <motion.div
            className="absolute -top-3.5 -left-2 pointer-events-none"
            initial={false}
            animate={play ? { scale: 1, rotate: 0, y: 0, opacity: 1 } : { scale: 0, rotate: -30, y: -10, opacity: 0 }}
            transition={{ ...SPRING_POP, delay: CROWN_DELAY }}
          >
            <FluentEmoji emoji="👑" size={24} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ScoreStack() {
  // Flip `play` one frame after mount so the entrance animations run even though
  // the parent slide's <AnimatePresence initial={false}> suppresses mount-initial.
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="relative w-[300px] h-[200px] mx-auto flex items-center justify-center">
      {STACK.map((c) => (
        <ScoreChip key={c.emoji} c={c} play={play} />
      ))}
    </div>
  );
}

function PlayerChips() {
  const chips = [
    { color: "#2DC5F8", emoji: "🦊" },
    { color: "#A855F7", emoji: "🐙" },
    { color: "#22C55E", emoji: "🐸" },
  ];
  return (
    <div className="flex items-center justify-center gap-3">
      {chips.map((c, i) => (
        <motion.div
          key={c.emoji}
          initial={{ scale: 0, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ ...SPRING_POP, delay: 0.12 + i * 0.1 }}
          className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center"
          style={{ backgroundColor: c.color }}
        >
          <FluentEmoji emoji={c.emoji} size={38} />
        </motion.div>
      ))}
    </div>
  );
}

function MiniScoreboard() {
  const rows = [
    { color: "#2DC5F8", emoji: "🦊", score: 24, leader: true },
    { color: "#A855F7", emoji: "🐙", score: 18, leader: false },
  ];
  return (
    <div className="w-full max-w-[240px] mx-auto space-y-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.emoji}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING_SNAPPY, delay: 0.15 + i * 0.12 }}
          className="relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <div
            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: r.color }}
          >
            <FluentEmoji emoji={r.emoji} size={24} />
          </div>
          <div className="flex-1" />
          <motion.span
            key={r.score}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_POP, delay: 0.3 + i * 0.12 }}
            className="text-2xl font-bold tabular-nums"
            style={{ color: r.color }}
          >
            {r.score}
          </motion.span>
          {r.leader && (
            <motion.div
              initial={{ scale: 0, rotate: -25, y: -6 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ ...SPRING_POP, delay: 0.55 }}
              className="absolute -top-3 -left-2"
            >
              <FluentEmoji emoji="👑" size={26} />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

const SLIDES = [
  {
    key: "welcome",
    hero: <ScoreStack />,
    title: "Welcome to SCRKPR!",
    body: "The simplest, most delightful way to prove who's better than the other",
  },
  {
    key: "players",
    hero: <PlayerChips />,
    title: "Set up the culprits",
    body: "Give everyone a color and an emoji to match their confidence.",
  },
  {
    key: "score",
    hero: <MiniScoreboard />,
    title: "Just tap to keep score",
    body: "Settle the debate once and for all. We tally the points and keep the receipts — no account, no mercy.",
  },
];

export default function Onboarding({ onDone }) {
  const [[step, dir], setStep] = useState([0, 0]);
  const isLast = step === SLIDES.length - 1;

  // Live swipe offset drives the background parallax.
  const swipeX = useMotionValue(0);
  const logoRef = useRef(null);
  // Completion morph: the header logo flies into the home-screen logo slot.
  const [flying, setFlying] = useState(null); // { from:{x,y,w}, to:{x,y,w} } | null
  const exiting = flying !== null;

  const go = (next) => {
    if (next < 0 || next >= SLIDES.length) return;
    setStep([next, next > step ? 1 : -1]);
  };

  const dismiss = () => {
    setOnboarded();
    onDone?.();
  };

  // Finish = morph the header logo into the home logo slot, then dismiss. If the
  // home anchor can't be measured, fall back to dismissing immediately.
  const finish = () => {
    if (exiting) return;
    const logoEl = logoRef.current;
    const anchor = document.querySelector("[data-logo-anchor]");
    if (logoEl && anchor) {
      const f = logoEl.getBoundingClientRect();
      const t = anchor.getBoundingClientRect();
      if (f.width && t.width) {
        setFlying({
          from: { x: f.left, y: f.top, w: f.width },
          to: { x: t.left, y: t.top, w: t.width },
        });
        return;
      }
    }
    dismiss();
  };

  const slide = SLIDES[step];

  const variants = {
    enter: (d) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DUR_MEDIUM }}
    >
      {/* Everything except the flying logo fades out together on completion,
          revealing the home screen (whose persistent logo sits exactly where
          our flyer lands). */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Living gradient field, behind everything */}
        <OnboardingBackground step={step} swipeX={swipeX} />

        {/* Persistent header — logo left, Skip right */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-4 h-14 flex-shrink-0">
          <img
            ref={logoRef}
            src={logoDark}
            alt="SCRKPR"
            draggable={false}
            className="h-6 w-auto select-none"
            style={{ opacity: flying ? 0 : 1 }}
          />
          <AnimatePresence>
            {!isLast && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={finish}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Slide body — swipeable */}
        <div className="flex-1 relative overflow-hidden z-10">
          <AnimatePresence custom={dir} mode="wait" initial={false}>
            <motion.div
              key={slide.key}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_SHEET}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDrag={(e, info) => swipeX.set(info.offset.x)}
              onDragEnd={(e, info) => {
                animate(swipeX, 0, SPRING_SHEET);
                if (info.offset.x < -80) go(step + 1);
                else if (info.offset.x > 80) go(step - 1);
              }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center cursor-grab active:cursor-grabbing"
            >
              <div className="min-h-[12rem] flex items-center justify-center mb-6">{slide.hero}</div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-3 leading-tight">{slide.title}</h1>
              <p className="text-base text-white/70 max-w-[20rem] leading-relaxed">{slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — dots + CTA */}
        <div className="relative z-10 flex-shrink-0 px-8 pb-8 pt-4 space-y-6">
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className="h-2 rounded-full transition-colors"
              >
                <motion.span
                  className="block h-2 rounded-full"
                  animate={{
                    width: i === step ? 24 : 8,
                    backgroundColor: i === step ? "#2DC5F8" : "hsl(var(--border))",
                  }}
                  transition={SPRING_SNAPPY}
                />
              </button>
            ))}
          </div>

          <Button
            onClick={() => (isLast ? finish() : go(step + 1))}
            className="w-full h-12 rounded-full text-base font-semibold bg-white hover:bg-white/90 text-[#111111]"
          >
            {isLast ? "Start scoring" : "Next"}
          </Button>
        </div>
      </motion.div>

      {/* The flying logo — morphs from the header into the home-screen slot,
          then unmounts the FTU (revealing the identical persistent logo beneath). */}
      {flying && (
        <motion.img
          src={logoDark}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="fixed left-0 top-0 z-[70] pointer-events-none select-none"
          style={{ height: "auto", transformOrigin: "top left" }}
          initial={{ x: flying.from.x, y: flying.from.y, width: flying.from.w }}
          animate={{ x: flying.to.x, y: flying.to.y, width: flying.to.w }}
          transition={SPRING_SHEET}
          onAnimationComplete={dismiss}
        />
      )}
    </motion.div>
  );
}

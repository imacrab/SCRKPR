import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import NeoIcon from "@/components/scorekeeper/NeoIcon";
import { LogoSticker, PlayerTile, Tag, CrownGlyph, PAGE_TOP } from "@/components/scorekeeper/neo";
import { SPRING_SHEET, SPRING_SNAPPY, SPRING_POP, DUR_MEDIUM } from "@/lib/motion";
import { setOnboarded } from "@/lib/onboarding";
import { ONBOARDING_DONE_EVENT } from "@/lib/useIntroReveal";

// Shown once on first launch (gated in App.jsx). The SCRKPR sticker lives in a
// persistent header across all slides, then flies into the home-screen logo
// slot when the flow completes.

// A number that counts up from 0 to `to` — the app's score-pop energy. Starts
// when `play` flips true so it stays in sync with the card's entrance.
function CountUp({ to, className = "", delay = 0, duration = 1.0, play = true }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (!play) return;
    const controls = animate(mv, to, { duration, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, to, delay, duration, play]);
  return <motion.span className={`font-display tabular-nums ${className}`}>{rounded}</motion.span>;
}

// Plays once per mount even though the slide's <AnimatePresence initial={false}>
// suppresses mount-initial animations.
function usePlay() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return play;
}

// A choreographed cascade: the hero card counts up first, the satellites pop in
// while it's still climbing, and the crown lands last.
const STACK = [
  { icon: "shell", color: "#9B6BFF", score: 24, left: 82, top: 146, rotate: -3, delay: 0.3, countDur: 1.0, hero: true },
  { icon: "squirrel", color: "#FF8A1F", score: 19, left: 190, top: 20, rotate: 7, delay: 0.62, countDur: 0.9 },
  { icon: "dog", color: "#1FBFFF", score: 12, left: 0, top: 30, rotate: -8, delay: 0.9, countDur: 0.8 },
  { icon: "fish", color: "#1FD66F", score: 8, left: 38, top: 256, rotate: 4, delay: 1.15, countDur: 0.7 },
];
const CROWN_DELAY = 2.1;

function ScoreStack() {
  const play = usePlay();
  return (
    <div className="relative w-[330px] h-[330px] mx-auto">
      {STACK.map((c) => (
        <motion.div
          key={c.icon}
          className="absolute"
          style={{ left: c.left, top: c.top, zIndex: c.hero ? 2 : 1 }}
          initial={false}
          animate={play ? { opacity: 1, y: 0, scale: 1, rotate: c.rotate } : { opacity: 0, y: 44, scale: 0.65, rotate: c.rotate * 0.4 }}
          transition={{ ...SPRING_SNAPPY, delay: c.delay }}
        >
          <div
            className={`relative flex items-center gap-3 border-3 border-ink rounded-[14px] ${c.hero ? "py-3 pl-3 pr-6 bg-sun text-ink shadow-neo-lg" : "py-2.5 pl-2.5 pr-5 bg-surface shadow-neo-md"}`}
          >
            {c.hero && (
              <motion.span
                className="absolute -left-4 -top-[26px] text-fg"
                initial={false}
                animate={play ? { scale: 1, rotate: -18, opacity: 1 } : { scale: 0, rotate: -50, opacity: 0 }}
                transition={{ ...SPRING_POP, delay: CROWN_DELAY }}
              >
                <CrownGlyph width={42} height={32} />
              </motion.span>
            )}
            <PlayerTile icon={c.icon} color={c.color} size={c.hero ? 52 : 44} radius={c.hero ? 12 : 10} />
            <CountUp to={c.score} className={c.hero ? "text-[40px]" : "text-[30px]"} delay={c.delay + 0.1} duration={c.countDur} play={play} />
          </div>
        </motion.div>
      ))}
      <motion.span
        className="font-display absolute left-[276px] top-[104px] w-[54px] h-[54px] flex items-center justify-center bg-[#FF4FA0] text-ink border-3 border-ink rounded-full text-[17px]"
        initial={false}
        animate={play ? { scale: 1, rotate: 12 } : { scale: 0, rotate: -30 }}
        transition={{ ...SPRING_POP, delay: 1.5 }}
      >
        +5
      </motion.span>
    </div>
  );
}

function PlayerChips() {
  const tiles = [
    { color: "#FF4FA0", icon: "sparkles", size: 104, rotate: -9, y: 10 },
    { color: "#1FBFFF", icon: "cat", size: 118, rotate: 3, y: 0 },
    { color: "#1FD66F", icon: "rocket", size: 104, rotate: 8, y: 14 },
  ];
  const swatches = ["#FF4FA0", "#1FBFFF", "#9B6BFF", "#FF8A1F", "#1FD66F", "#FFFFFF"];
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center h-[150px]">
        {tiles.map((t, i) => (
          <motion.div
            key={t.icon}
            initial={{ scale: 0, y: 24 }}
            animate={{ scale: 1, y: t.y }}
            transition={{ ...SPRING_POP, delay: 0.12 + i * 0.1 }}
            className={i === 1 ? "relative z-10 -mx-2" : ""}
          >
            <PlayerTile icon={t.icon} color={t.color} size={t.size} radius={t.size > 110 ? 24 : 22} rotate={t.rotate} className={t.size > 110 ? "shadow-neo-lg" : "shadow-neo-md"} />
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-2.5">
        {swatches.map((c, i) => (
          <motion.span
            key={c}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...SPRING_POP, delay: 0.5 + i * 0.05 }}
            className="w-[26px] h-[26px] border-2.5 border-ink rounded-[7px]"
            style={{ background: c, boxShadow: i === 1 ? "0 0 0 3px #FFD23F, 0 0 0 6px rgb(var(--ink))" : "none" }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniScoreboard() {
  const rows = [
    { color: "#FF4FA0", icon: "sparkles", name: "Maya", score: 24, leader: true },
    { color: "#FF8A1F", icon: "dog", name: "Priya", score: 18 },
  ];
  return (
    <div className="relative w-full max-w-[320px] mx-auto flex flex-col gap-[18px]">
      {rows.map((r, i) => (
        <motion.div
          key={r.icon}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING_SNAPPY, delay: 0.15 + i * 0.12 }}
          className="relative h-[84px] flex items-center gap-3 px-3 border-3 border-ink rounded-2xl shadow-neo-md"
          style={{ background: r.color }}
        >
          {r.leader && (
            <motion.span
              className="absolute -top-[15px] left-16"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SPRING_POP, delay: 0.55 }}
            >
              <Tag><CrownGlyph />Leader</Tag>
            </motion.span>
          )}
          <PlayerTile icon={r.icon} color="#FFFFFF" size={44} radius={10} />
          <span className="flex-1 text-left text-xl font-extrabold">{r.name}</span>
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_POP, delay: 0.3 + i * 0.12 }}
            className="font-display text-[32px]"
          >
            {r.score}
          </motion.span>
          <span className="w-10 h-10 flex items-center justify-center bg-ink rounded-[10px]">
            <Plus size={18} strokeWidth={3.5} color="#FFFFFF" />
          </span>
        </motion.div>
      ))}
      <motion.span
        className="absolute right-[-6px] top-[40px] z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: [30, 0, 6, 0] }}
        transition={{ delay: 0.8, duration: 0.9 }}
      >
        <NeoIcon name="pointer" knockout="#FFFFFF" strokeWidth={2.5} size={56} className="text-ink" />
      </motion.span>
    </div>
  );
}

const PAPER = "rgb(var(--paper))";

// The flying sticker morphs between the real computed styles of the header and
// home-screen stickers (rather than scaling one of them) so both ends of the
// flight are pixel-identical and the handoff can be an instant swap.
function stickerGeometry(el) {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    width: rect.width,
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    style: {
      fontSize: cs.fontSize,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderTopLeftRadius,
      boxShadow: cs.boxShadow,
      backgroundColor: cs.backgroundColor,
    },
  };
}

const SLIDES = [
  {
    key: "welcome",
    hero: <ScoreStack />,
    bg: PAPER,
    align: "left",
    title: (
      <>
        Welcome to
        <br />
        <span className="inline-block mt-1.5 px-2 pb-0.5 bg-[#FF4FA0] text-ink border-3 border-ink rounded-lg" style={{ transform: "rotate(-1.5deg)" }}>
          SCRKPR!
        </span>
      </>
    ),
    body: "Keep score for any game night. No pencil, no paper, no arguments.",
  },
  {
    key: "players",
    hero: <PlayerChips />,
    bg: "#FFD23F",
    align: "center",
    title: "Set up the culprits",
    body: "Give everyone a color and an icon to match their confidence.",
  },
  {
    key: "score",
    hero: <MiniScoreboard />,
    bg: "#1FBFFF",
    align: "center",
    title: "Just tap to keep score",
    body: "Settle the debate once and for all. We tally the points and keep the receipts — no account, no mercy.",
  },
];

export default function Onboarding({ onDone }) {
  const [[step, dir], setStep] = useState([0, 0]);
  const isLast = step === SLIDES.length - 1;
  const logoRef = useRef(null);
  // Completion morph: the header sticker flies into the home-screen logo slot.
  const [flying, setFlying] = useState(null); // { from, to } sticker geometries | null
  const exiting = flying !== null;

  const go = (next) => {
    if (next < 0 || next >= SLIDES.length) return;
    setStep([next, next > step ? 1 : -1]);
  };

  const dismiss = () => {
    setOnboarded();
    window.dispatchEvent(new Event(ONBOARDING_DONE_EVENT));
    onDone?.();
  };

  const finish = () => {
    if (exiting) return;
    const from = logoRef.current?.firstElementChild;
    const to = document.querySelector("[data-logo-anchor]")?.firstElementChild;
    if (from && to) {
      const f = stickerGeometry(from);
      const t = stickerGeometry(to);
      if (f.width && t.width) {
        setFlying({ from: f, to: t });
        return;
      }
    }
    dismiss();
  };

  const slide = SLIDES[step];
  const centered = slide.align === "center";

  const variants = {
    enter: (d) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
  };

  return (
    <motion.div
      className={`fixed inset-0 z-[60] overflow-hidden ${slide.bg === PAPER ? "text-fg" : "text-ink"}`}
      style={{ backgroundColor: exiting ? "transparent" : slide.bg, transition: `background-color ${DUR_MEDIUM}s ease, color ${DUR_MEDIUM}s ease` }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: exiting ? 0 : DUR_MEDIUM } }}
      transition={{ duration: DUR_MEDIUM }}
    >
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ paddingTop: PAGE_TOP, paddingBottom: "env(safe-area-inset-bottom)" }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative z-20 flex items-center justify-between px-6 h-11 flex-shrink-0">
          <span ref={logoRef} style={{ opacity: flying ? 0 : 1 }}>
            <LogoSticker bg={slide.bg === "#FFD23F" ? "#FFFFFF" : "#FFD23F"} />
          </span>
          <AnimatePresence>
            {!isLast && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={finish}
                className="px-1 py-3 text-base font-extrabold underline decoration-2 underline-offset-4"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </div>

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
              onDragEnd={(e, info) => {
                if (info.offset.x < -80) go(step + 1);
                else if (info.offset.x > 80) go(step - 1);
              }}
              className={`absolute inset-0 flex flex-col px-6 pb-2 cursor-grab active:cursor-grabbing ${centered ? "items-center text-center" : "items-stretch text-left"}`}
            >
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">{slide.hero}</div>
              <h1 className={`font-display mt-6 text-[36px] leading-[1.1] uppercase ${centered ? "" : "self-start"}`}>{slide.title}</h1>
              <p className={`mt-4 text-[17px] leading-[1.45] font-medium max-w-[300px] ${centered ? "" : "text-subtle"}`}>{slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex-shrink-0 px-6 pb-8 pt-4">
          <div className="flex items-center justify-center gap-2 mb-[22px]">
            {SLIDES.map((sl, i) => (
              <button key={sl.key} aria-label={`Go to slide ${i + 1}`} onClick={() => go(i)} className="py-2">
                <motion.span
                  className="block h-3 rounded-md"
                  style={{ borderColor: slide.bg === PAPER ? "rgb(var(--fg))" : "rgb(var(--ink))" }}
                  animate={{
                    width: i === step ? 34 : 12,
                    backgroundColor: i === step
                      ? slide.bg === PAPER ? "rgb(var(--fg))" : "rgb(var(--ink))"
                      : slide.bg === PAPER ? "rgb(var(--paper))" : "#FFFFFF",
                    borderWidth: i === step ? 0 : 2.5,
                  }}
                  transition={SPRING_SNAPPY}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => (isLast ? finish() : go(step + 1))}
            className="neo-press w-[calc(100%-6px)] h-16 flex items-center justify-center gap-2.5 border-3 border-ink rounded-xl shadow-neo-lg text-xl font-extrabold"
            style={{ background: isLast ? "#FFD23F" : slide.bg === PAPER ? "rgb(var(--surface))" : "#FFFFFF" }}
          >
            {isLast ? "Start scoring" : "Next"}
            <ArrowRight size={22} strokeWidth={2.75} />
          </button>
        </div>
      </motion.div>

      {flying && (
        <motion.span
          aria-hidden="true"
          className="fixed z-[70] pointer-events-none select-none"
          style={{ left: flying.from.cx, top: flying.from.cy }}
          initial={{ x: 0, y: 0 }}
          animate={{ x: flying.to.cx - flying.from.cx, y: flying.to.cy - flying.from.cy }}
          transition={SPRING_SHEET}
          onAnimationComplete={dismiss}
        >
          <motion.span
            className="font-display absolute left-0 top-0 whitespace-nowrap border-3 border-ink leading-none text-ink"
            style={{ transform: "translate(-50%, -50%) rotate(-3deg)" }}
            initial={flying.from.style}
            animate={flying.to.style}
            transition={SPRING_SHEET}
          >
            SCRKPR!
          </motion.span>
        </motion.span>
      )}
    </motion.div>
  );
}

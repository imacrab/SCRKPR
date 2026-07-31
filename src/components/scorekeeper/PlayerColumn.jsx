import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { readableTextColor } from "@/lib/contrast";
import FluentEmoji from "./FluentEmoji";
import { SPRING_POP, SPRING_POP_SNAPPY, SPRING_SNAPPY, TRANSITION_SLIDE_OUT } from "@/lib/motion";

function AnimatedTotal({ value, color }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === 0 && prevValue.current > 0) {
      // Countdown animation from previous value to 0
      setIsResetting(true);
      const startValue = prevValue.current;
      const duration = 600; // ms
      const startTime = Date.now();

      const countdownInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(startValue * (1 - progress));
        setDisplayValue(current);

        if (progress === 1) {
          clearInterval(countdownInterval);
          setIsResetting(false);
          setAnimKey((k) => k + 1);
        }
      }, 16);

      return () => clearInterval(countdownInterval);
    } else if (value !== prevValue.current) {
      prevValue.current = value;
      setDisplayValue(value);
      setAnimKey((k) => k + 1);
    }
  }, [value]);

  return (
    // overflow is intentionally NOT clipped here — the sliding digits are
    // allowed to travel beyond this little number box and get clipped by the
    // player card instead (the card header has overflow-hidden). This gives
    // the digit a full runway: the old value slides up and fades out the top,
    // the new value rises in from below.
    <span className="font-bold leading-none block text-3xl relative" style={{ color, opacity: isResetting ? 0.7 : 1, height: "1em", minWidth: "1ch" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={animKey}
          initial={{ y: "120%", opacity: 0, scale: 0.7 }}
          animate={{ y: "0%", opacity: 1, scale: 1 }}
          exit={{ y: "-120%", opacity: 0, scale: 0.7 }}
          transition={SPRING_SNAPPY}
          className="block">

          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>);

}

export default function PlayerColumn({ player, isLeader = false, isWorst = false, isHighlighted = false, streak = 0, winsNeeded = null, isFirst = false, isLast = false, scoredThisRound = false, onAddScore, onEditScore, onEditPlayer }) {
  // If the leader is also somehow the worst (single player, everyone tied on 0
  // — edge cases only), the crying emoji wins and the crown is suppressed.
  const showLeader = isLeader && !isWorst;
  const baseTotal = player.scores.reduce((s, n) => s + n, 0);
  const isBestOf = winsNeeded !== null;
  const lastIdx = player.scores.length - 1;
  const lastScore = lastIdx >= 0 ? player.scores[lastIdx] : null;

  const total = baseTotal;

  // Full-opacity player color for the card background — bright & playful.
  // (Was 0.7 alpha over the near-black page, which muted the color into a
  // muddy tint; full opacity lets the light palette read as intended.)
  const bgTint = useMemo(() => {
    const hex = (player.color || "#000000").replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }, [player.color]);

  // WCAG 2.2 — pick text color that contrasts with the player's background
  const textColor = useMemo(() => readableTextColor(player.color || "#000000"), [player.color]);
  const isDarkText = textColor === "#111111";
  const streakBg = isDarkText ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.25)";
  const subtleText = isDarkText ? "rgba(17,17,17,0.65)" : "rgba(255,255,255,0.75)";

  return (
    <div className="flex flex-col rounded-xl overflow-hidden">
      {/* Header — player color background */}
      <div
        className="relative px-3 py-3 rounded-lg flex flex-col items-center z-10 transition-all overflow-hidden"
        style={{
          backgroundColor: bgTint,
          borderColor: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"
        }}>

        {/* Leader crown — flies between players when the lead changes (shared layoutId) */}
        <AnimatePresence>
          {showLeader && (
            <motion.div
              layoutId="leader-crown"
              initial={{ scale: 0, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: 14, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={SPRING_POP}
              className="absolute pointer-events-none select-none z-20"
              style={{ top: 4, right: 8 }}
              aria-hidden="true"
            >
              <FluentEmoji emoji="👑" size={26} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Worst flair (low-score modes only) — mirrors the crown; flies between
            players when last place changes via shared layoutId. */}
        <AnimatePresence>
          {isWorst && (
            <motion.div
              layoutId="worst-cry"
              initial={{ scale: 0, rotate: 40, opacity: 0 }}
              animate={{ scale: 1, rotate: -14, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={SPRING_POP}
              className="absolute pointer-events-none select-none z-20"
              style={{ top: 4, right: 8 }}
              aria-hidden="true"
            >
              <FluentEmoji emoji="😭" size={26} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flourish — oversized tilted player emoji bleeding off the left edge.
            Once the player has logged this round it morphs into a green check;
            it morphs back when the round resets. */}
        {(player.emoji || scoredThisRound) &&
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: -12,
            top: "50%",
            transform: "rotate(-20deg) translateY(-50%)",
            opacity: 0.95,
            // Soft shadow lifts the emoji off the vivid card color (separation,
            // not opacity) so the 3D art reads crisply on saturated backgrounds.
            filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.40))",
            zIndex: 0
          }}
          aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false}>
              {scoredThisRound ? (
                // Check lives on the TOP: slides down from above into place on
                // capture, slides back up and out when the round resets.
                <motion.div
                  key="check"
                  initial={{ y: -104, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -104, opacity: 0, transition: TRANSITION_SLIDE_OUT }}
                  transition={SPRING_POP_SNAPPY}
                >
                  <FluentEmoji emoji="✅" size={96} />
                </motion.div>
              ) : player.emoji ? (
                // Emoji lives on the BOTTOM: slides down and out on capture,
                // slides back up into place from below on the next round.
                <motion.div
                  key="emoji"
                  initial={{ y: 104, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 104, opacity: 0, transition: TRANSITION_SLIDE_OUT }}
                  transition={SPRING_POP_SNAPPY}
                >
                  <span className="block" style={{ transform: "scaleX(-1)" }}>
                    <FluentEmoji emoji={player.emoji} size={96} />
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        }

        <div className="relative z-10 flex items-center justify-between w-full gap-1">
          {/* Name (left) — tap to open score modal, long-press to edit player */}
          <button
            onClick={onAddScore}
            onContextMenu={(e) => {e.preventDefault();onEditPlayer?.();}}
            onPointerDown={(e) => {
              const timer = setTimeout(() => onEditPlayer?.(), 500);
              const cancel = () => clearTimeout(timer);
              e.currentTarget.addEventListener("pointerup", cancel, { once: true });
              e.currentTarget.addEventListener("pointerleave", cancel, { once: true });
              e.currentTarget.addEventListener("pointercancel", cancel, { once: true });
            }}
            className="flex-1 flex flex-col items-start gap-1 min-w-0 text-left"
            style={{ marginLeft: isBestOf ? 8 : 68 }}>
            
            <div className="flex items-center gap-2 w-full min-w-0">
              <span className="font-bold truncate leading-tight text-xl" title={player.name} style={{ color: textColor }}>
                {player.name}
              </span>
              {streak >= 2 &&
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRING_POP}
                className="inline-flex items-center gap-0.5 rounded-full px-1 py-1 flex-shrink-0"
                style={{ backgroundColor: streakBg, color: textColor }}>
                  <motion.span
                    animate={{ scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="flex"
                  >
                    <FluentEmoji emoji="🔥" size={14} />
                  </motion.span>
                  <span className="text-[10px] font-semibold leading-none">{streak}</span>
                </motion.span>
              }
            </div>
            {/* Reserve the subtext line always (high/low) so logging a score
                doesn't change the card's height. */}
            {!isBestOf &&
            <div className="h-[18px] flex items-center">
              {lastScore !== null &&
              <motion.span
                key={lastIdx}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
                onClick={(e) => {e.stopPropagation();onEditScore?.(lastIdx);}}
                className="text-sm leading-none cursor-pointer [font-family:'Geist',_sans-serif] font-medium"
                style={{ color: subtleText }}>

                  ({lastScore > 0 ? `+${lastScore}` : lastScore})
                </motion.span>
              }
            </div>
            }
          </button>

          {/* Total — tap to open score modal */}
          <button
            onClick={onAddScore}
            className="flex-shrink-0"
            style={{ marginRight: 8 }}
            aria-label={`Add score for ${player.name}`}>
            
            <AnimatedTotal value={total} color={textColor} />
          </button>
        </div>
      </div>

      {/* Best Of win dots (only in bestof mode) */}
      {isBestOf &&
      <div className="bg-background flex items-center justify-center gap-2 px-2 py-3">
          {Array.from({ length: winsNeeded }).map((_, idx) => {
          const won = idx < total;
          return (
            <motion.div
              key={idx}
              initial={won ? { scale: 0 } : false}
              animate={{ scale: 1 }}
              transition={SPRING_SNAPPY}
              className="w-3 h-3 rounded-full border-2 flex-shrink-0"
              style={{
                backgroundColor: won ? player.color : "transparent",
                borderColor: won ? player.color : "hsl(var(--border))"
              }} />);


        })}
        </div>
      }
    </div>);

}
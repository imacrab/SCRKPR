import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";

import FluentEmoji from "./FluentEmoji";
import { PlayerTile, Tag, CrownGlyph } from "./neo";
import { toNeoColor, twoToneBackground } from "@/lib/colors";
import { SPRING_POP, SPRING_POP_SNAPPY, SPRING_SNAPPY, TRANSITION_SLIDE_OUT } from "@/lib/motion";

function AnimatedTotal({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === 0 && prevValue.current > 0) {
      setIsResetting(true);
      const startValue = prevValue.current;
      const duration = 600;
      const startTime = Date.now();

      const countdownInterval = setInterval(() => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        setDisplayValue(Math.round(startValue * (1 - progress)));
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
    // Not clipped: digits slide past this box and are clipped by the card.
    <span className={`font-display leading-none block relative ${String(displayValue).length >= 5 ? "text-[28px]" : "text-[34px]"}`} style={{ opacity: isResetting ? 0.7 : 1, height: "1em", minWidth: "1ch" }}>
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
    </span>
  );
}

const formatDelta = (n) => (n > 0 ? `+${n}` : `${n}`);

export default function PlayerColumn({ player, isLeader = false, isWorst = false, isHighlighted = false, streak = 0, winsNeeded = null, behind = 0, scoredThisRound = false, onAddScore, onEditScore, onEditPlayer }) {
  // If the leader is also the worst (single player / everyone tied on 0), the
  // worst flair wins and the crown is suppressed.
  const showLeader = isLeader && !isWorst;
  const total = player.scores.reduce((s, n) => s + n, 0);
  const isBestOf = winsNeeded !== null;
  const lastIdx = player.scores.length - 1;
  const lastScore = lastIdx >= 0 ? player.scores[lastIdx] : null;
  const color = toNeoColor(player.color);
  const background = player.cardStyle === "gradient"
    ? twoToneBackground(color)
    : color;

  let subline = null;
  if (lastScore !== null) {
    if (showLeader) subline = `${formatDelta(lastScore)} ${scoredThisRound ? "this round" : "last round"}`;
    else if (behind > 0) subline = `${formatDelta(lastScore)} · ${behind} behind`;
    else subline = `${formatDelta(lastScore)} · tied`;
  }

  return (
    <div
      onClick={onAddScore}
      onContextMenu={(e) => { e.preventDefault(); onEditPlayer?.(); }}
      onPointerDown={(e) => {
        const timer = setTimeout(() => onEditPlayer?.(), 500);
        const cancel = () => clearTimeout(timer);
        e.currentTarget.addEventListener("pointerup", cancel, { once: true });
        e.currentTarget.addEventListener("pointerleave", cancel, { once: true });
        e.currentTarget.addEventListener("pointercancel", cancel, { once: true });
      }}
      role="button"
      aria-label={`Add score for ${player.name}`}
      className="relative mr-[5px] h-24 flex items-center gap-3 px-3 text-ink border-3 border-ink rounded-2xl cursor-pointer select-none transition-[box-shadow,transform] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-sm"
      style={{
        background,
        boxShadow: isHighlighted ? "7px 7px 0 rgb(var(--ink))" : "5px 5px 0 rgb(var(--ink))",
      }}
    >
      <AnimatePresence>
        {showLeader && (
          <motion.div
            layoutId="leader-tag"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING_POP}
            className="absolute -top-[15px] left-3 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <Tag><CrownGlyph />Leader</Tag>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWorst && (
          <motion.div
            layoutId="worst-tag"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING_POP}
            className="absolute -top-[15px] left-3 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <Tag bg="#FF4B3E" rotate={3}><FluentEmoji emoji="😭" size={13} />Worst round</Tag>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerTile color={scoredThisRound ? "rgb(var(--ink))" : "#FFFFFF"} size={48} radius={11} className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {scoredThisRound ? (
            <motion.span
              key="check"
              className="flex"
              initial={{ y: -48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -48, opacity: 0, transition: TRANSITION_SLIDE_OUT }}
              transition={SPRING_POP_SNAPPY}
            >
              <Check size={26} strokeWidth={3.5} color="#FFFFFF" />
            </motion.span>
          ) : player.emoji ? (
            <motion.span
              key="emoji"
              className="flex"
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0, transition: TRANSITION_SLIDE_OUT }}
              transition={SPRING_POP_SNAPPY}
            >
              <FluentEmoji emoji={player.emoji} size={34} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </PlayerTile>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl font-extrabold truncate leading-tight" title={player.name}>{player.name}</span>
          {streak >= 2 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_POP} className="flex-shrink-0">
              <Tag bg="#FFFFFF" rotate={0} className="!px-1.5 !gap-0.5">
                <motion.span
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="flex"
                >
                  <FluentEmoji emoji="🔥" size={12} />
                </motion.span>
                {streak}
              </Tag>
            </motion.span>
          )}
        </div>
        {isBestOf ? (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: winsNeeded }).map((_, idx) => {
              const won = idx < total;
              return (
                <motion.span
                  key={idx}
                  initial={won ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={SPRING_SNAPPY}
                  className="w-3.5 h-3.5 border-2 border-ink rounded-[4px] flex-shrink-0"
                  style={{ backgroundColor: won ? "rgb(var(--ink))" : "#FFFFFF" }}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-[18px] mt-[3px] flex items-center">
            {subline && (
              <motion.span
                key={lastIdx}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_SNAPPY}
                onClick={(e) => { e.stopPropagation(); onEditScore?.(lastIdx); }}
                className="font-mono text-xs font-bold uppercase truncate cursor-pointer"
              >
                {subline}
              </motion.span>
            )}
          </div>
        )}
      </div>

      <div className="min-w-[60px] flex-shrink-0 flex justify-center">
        <AnimatedTotal value={total} />
      </div>

      <span
        aria-hidden="true"
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-ink border-3 border-ink rounded-[10px]"
      >
        <Plus size={18} strokeWidth={3.5} color="#FFFFFF" />
      </span>
    </div>
  );
}

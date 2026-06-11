import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { Plus, Minus, Flame } from "lucide-react";
import { readableTextColor } from "@/lib/contrast";
import FluentEmoji from "./FluentEmoji";

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
    <span className="font-bold leading-none block text-3xl relative overflow-hidden" style={{ color, opacity: isResetting ? 0.7 : 1, height: "1em", minWidth: "1ch" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={animKey}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18, mass: 0.8 }}
          className="block">
          
          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>);

}

export default function PlayerColumn({ player, isHighlighted = false, streak = 0, winsNeeded = null, isFirst = false, isLast = false, onAddScore, onQuickScore, onEditScore, onEditPlayer }) {
  const baseTotal = player.scores.reduce((s, n) => s + n, 0);
  const isBestOf = winsNeeded !== null;
  const lastIdx = player.scores.length - 1;
  const lastScore = lastIdx >= 0 ? player.scores[lastIdx] : null;

  // Batch rapid +/- taps within 1.5s into a single score entry
  const [pendingDelta, setPendingDelta] = useState(0);
  const commitTimerRef = useRef(null);
  const pendingRef = useRef(0);

  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
  }, []);

  const handleQuickTap = (delta) => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (isBestOf) {
      onQuickScore?.(delta);
      return;
    }
    pendingRef.current += delta;
    setPendingDelta(pendingRef.current);

    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      const finalDelta = pendingRef.current;
      pendingRef.current = 0;
      setPendingDelta(0);
      commitTimerRef.current = null;
      if (finalDelta !== 0) onQuickScore?.(finalDelta);
    }, 1500);
  };

  const total = baseTotal + pendingDelta;
  const showPending = pendingDelta !== 0;

  // Convert player color to rgba(...,0.2) for the card background tint
  const bgTint = useMemo(() => {
    const hex = (player.color || "#000000").replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }, [player.color]);

  // WCAG 2.2 — pick text color that contrasts with the player's background
  const textColor = useMemo(() => readableTextColor(player.color || "#000000"), [player.color]);
  const isDarkText = textColor === "#111111";
  const buttonBg = "rgba(255,255,255,0.08)";
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

        {/* Flourish — oversized tilted player emoji bleeding off the left edge */}
        {player.emoji &&
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: -12,
            top: "50%",
            transform: "rotate(5deg) translateY(-50%) scaleX(-1)",
            opacity: 0.95,
            zIndex: 0
          }}
          aria-hidden="true">
            <FluentEmoji emoji={player.emoji} size={80} />
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
            style={{ marginLeft: isBestOf ? 8 : 60 }}>
            
            <div className="flex items-center gap-2 w-full min-w-0">
              <span className="font-bold truncate leading-tight text-xl" title={player.name} style={{ color: textColor }}>
                {player.name}
              </span>
              {streak >= 2 &&
              <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: streakBg, color: textColor }}>
                  <Flame size={12} strokeWidth={2.5} />
                  <span className="text-[10px] font-semibold leading-none">{streak}</span>
                </span>
              }
            </div>
            {!isBestOf && showPending &&
            <motion.span
              key="pending"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="text-sm font-semibold leading-none"
              style={{ color: textColor }}>
              
                ({pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta})
              </motion.span>
            }
            {!isBestOf && !showPending && lastScore !== null &&
            <motion.span
              key={lastIdx}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              onClick={(e) => {e.stopPropagation();onEditScore?.(lastIdx);}}
              className="text-sm leading-none cursor-pointer [font-family:'Geist',_sans-serif] font-medium"
              style={{ color: subtleText }}>
              
                ({lastScore > 0 ? `+${lastScore}` : lastScore})
              </motion.span>
            }
          </button>

          {/* Total — tap to open score modal */}
          <button
            onClick={onAddScore}
            className="flex-shrink-0"
            style={{ marginRight: 8 }}
            aria-label={`Add score for ${player.name}`}>
            
            <AnimatedTotal value={total} color="#FFFFFF" />
          </button>

          {/* Minus (±1) — hidden in bestof mode */}
          {!isBestOf &&
          <motion.button
            onClick={() => handleQuickTap(-1)}
            whileTap={{ scale: 0.75 }}
            transition={{ type: "spring", stiffness: 800, damping: 8, mass: 0.5 }}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: buttonBg, color: textColor, backdropFilter: "blur(2.5px)", WebkitBackdropFilter: "blur(2.5px)" }}
            aria-label={`Subtract 1 from ${player.name}`}>
            
              <Minus size={20} strokeWidth={2.5} />
            </motion.button>
          }

          {/* Plus (±1) — hidden in bestof mode */}
          {!isBestOf &&
          <motion.button
            onClick={() => handleQuickTap(1)}
            whileTap={{ scale: 0.75 }}
            transition={{ type: "spring", stiffness: 800, damping: 8, mass: 0.5 }}
            className="flex items-center justify-center flex-shrink-0 bg-[#ffffff]/20"
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: buttonBg, color: textColor, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            aria-label={`Add 1 to ${player.name}`}>
            
              <Plus size={20} strokeWidth={2.5} />
            </motion.button>
          }
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
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
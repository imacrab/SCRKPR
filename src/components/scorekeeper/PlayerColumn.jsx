import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Plus, Minus, Flame } from "lucide-react";

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
    <AnimatePresence mode="popLayout">
      <motion.span
        key={animKey}
        initial={{ scale: 0.6, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="text-4xl font-bold leading-none block"
        style={{ color, opacity: isResetting ? 0.7 : 1 }}
      >
        {displayValue}
      </motion.span>
    </AnimatePresence>
  );
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

  return (
    <div className="flex flex-col rounded-xl border border-border overflow-hidden">
      {/* Header — frosted glass */}
      <div
        className="px-2 py-3 rounded-sm flex flex-col items-center z-10 transition-all"
        style={{
          backgroundColor: isHighlighted ? `hsl(var(--primary) / 0.1)` : "hsl(var(--card) / 0.9)",
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
          borderColor: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
      >
        <div className="flex items-center justify-between w-full gap-3">
          {/* Minus (±1) — hidden in bestof mode */}
          {!isBestOf && (
            <motion.button
              onClick={() => handleQuickTap(-1)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
              className="flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground active:bg-muted/60 border border-border"
              style={{ width: 44, height: 44, borderRadius: 12 }}
              aria-label={`Subtract 1 from ${player.name}`}
            >
              <Minus size={20} strokeWidth={2.5} />
            </motion.button>
          )}

          {/* Name (left) — tap to open score modal, long-press to edit player */}
          <button
            onClick={onAddScore}
            onContextMenu={(e) => { e.preventDefault(); onEditPlayer?.(); }}
            onPointerDown={(e) => {
              const timer = setTimeout(() => onEditPlayer?.(), 500);
              const cancel = () => clearTimeout(timer);
              e.currentTarget.addEventListener("pointerup", cancel, { once: true });
              e.currentTarget.addEventListener("pointerleave", cancel, { once: true });
              e.currentTarget.addEventListener("pointercancel", cancel, { once: true });
            }}
            className="flex-1 flex flex-col items-start gap-1 min-w-0 text-left"
            style={{ marginLeft: 16 }}
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <span className="text-s font-bold text-foreground truncate leading-tight" title={player.name}>
                {player.name}
              </span>
              {streak >= 2 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/20 text-orange-400 px-2 py-0.5 flex-shrink-0">
                  <Flame size={12} strokeWidth={2.5} />
                  <span className="text-[10px] font-semibold leading-none">{streak}</span>
                </span>
              )}
            </div>
            {!isBestOf && showPending && (
              <motion.span
                key="pending"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="text-sm font-semibold leading-none"
                style={{ color: player.color }}
              >
                ({pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta})
              </motion.span>
            )}
            {!isBestOf && !showPending && lastScore !== null && (
              <motion.span
                key={lastIdx}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                onClick={(e) => { e.stopPropagation(); onEditScore?.(lastIdx); }}
                className="text-sm font-semibold text-muted-foreground leading-none cursor-pointer"
              >
                ({lastScore > 0 ? `+${lastScore}` : lastScore})
              </motion.span>
            )}
          </button>

          {/* Total (right) — tap to open score modal */}
          <button
            onClick={onAddScore}
            className="flex-shrink-0"
            style={{ marginRight: 16 }}
            aria-label={`Add score for ${player.name}`}
          >
            <AnimatedTotal value={total} color={player.color} />
          </button>

          {/* Plus (±1) — hidden in bestof mode */}
          {!isBestOf && (
            <motion.button
              onClick={() => handleQuickTap(1)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
              className="flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground active:bg-muted/60 border border-border"
              style={{ width: 44, height: 44, borderRadius: 12 }}
              aria-label={`Add 1 to ${player.name}`}
            >
              <Plus size={20} strokeWidth={2.5} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Best Of win dots (only in bestof mode) */}
      {isBestOf && (
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
                  borderColor: won ? player.color : "hsl(var(--border))",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
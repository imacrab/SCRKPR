import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

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

export default function PlayerColumn({ player, isHighlighted = false, streak = 0, onAddScore, onEditScore, onEditPlayer }) {
  const total = player.scores.reduce((s, n) => s + n, 0);
  const lastIdx = player.scores.length - 1;
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  // Scroll to bottom whenever scores change so the latest is visible near the add button
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [player.scores.length]);

  // Check if content overflows
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [player.scores]);

  return (
    <div className="h-full flex flex-col border-r border-border last:border-r-0">
      {/* Header — frosted glass */}
      <div
        className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-2 border-b border-border z-10 transition-all"
        style={{
          backgroundColor: isHighlighted ? `hsl(var(--primary) / 0.1)` : "hsl(var(--card) / 0.9)",
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
          borderColor: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
      >
        <button onClick={onEditPlayer} className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-s font-bold text-foreground truncate max-w-[90] text-center leading-tight">
              {player.name}
            </span>
            {streak >= 2 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 leading-none">
                🔥{streak}
              </span>
            )}
          </div>
        </button>

        {/* Total */}
        <AnimatedTotal value={total} color={player.color} />
      </div>

      {/* Score history — newest at bottom, scrolls upward */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Top fade */}
        {canScroll && <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />}
        {/* Bottom fade */}
        {canScroll && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />}

        <div ref={scrollRef} className="h-full overflow-y-auto py-2 px-1">
          <AnimatePresence initial={false}>
            {player.scores.map((score, idx) => {
              const isCurrent = idx === lastIdx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className={`mb-1 mx-1 rounded-md px-2 py-1.5 text-center cursor-pointer ${
                    isCurrent ? "bg-card border border-border" : ""
                  }`}
                  onClick={() => onEditScore(idx)}
                >
                  <span
                    className={`font-semibold block leading-none text-s ${!isCurrent ? "text-muted-foreground" : ""}`}
                    style={isCurrent ? { color: player.color } : undefined}
                  >
                    {score > 0 ? `+${score}` : score}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Add score button */}
      <div className="flex-shrink-0 px-2" style={{ paddingTop: "8px", paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}>
        <div className="flex gap-2 border border-border rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--card) / 0.8)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
          <button
            onClick={onAddScore}
            className="flex-1 py-2 flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${player.color}18`, color: player.color }}
            aria-label={`Add score for ${player.name}`}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
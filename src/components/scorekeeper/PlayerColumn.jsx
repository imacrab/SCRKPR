import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

function AnimatedTotal({ value, color }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
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
        style={{ color }}
      >
        {displayValue}
      </motion.span>
    </AnimatePresence>
  );
}

export default function PlayerColumn({ player, onAddScore, onEditScore, onEditPlayer }) {
  const total = player.scores.reduce((s, n) => s + n, 0);
  const lastIdx = player.scores.length - 1;
  const scrollRef = useRef(null);

  // Scroll to bottom whenever scores change so the latest is visible near the add button
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [player.scores.length]);

  return (
    <div className="h-full flex flex-col border-r border-border last:border-r-0">
      {/* Header — frosted glass */}
      <div
        className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-2 border-b border-border z-10"
        style={{
          backgroundColor: "hsl(var(--card) / 0.9)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        <button onClick={onEditPlayer} className="flex flex-col items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          <span className="text-xs font-bold text-foreground truncate max-w-[70px] text-center leading-tight">
            {player.name}
          </span>
        </button>

        {/* Total */}
        <AnimatedTotal value={total} color={player.color} />
      </div>

      {/* Score history — newest at bottom, scrolls upward */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Top fade */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

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
      <div className="flex-shrink-0 p-2 bg-background border-t border-border">
        <button
          onClick={onAddScore}
          className="w-full h-9 rounded-md flex items-center justify-center transition-colors active:scale-95"
          style={{ backgroundColor: `${player.color}18`, color: player.color }}
          aria-label={`Add score for ${player.name}`}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
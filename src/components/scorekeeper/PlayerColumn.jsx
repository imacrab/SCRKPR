import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";

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

  return (
    <div className="h-full flex flex-col border-r border-border last:border-r-0">
      {/* Header */}
      <div className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-2 bg-card border-b border-border">
        <button
          onClick={onEditPlayer}
          className="flex items-center gap-1 group"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: player.color }}
          />
          <span className="text-xs font-bold text-foreground truncate max-w-[70px] text-center leading-tight">
            {player.name}
          </span>
          <Pencil size={9} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </button>

        {/* Total */}
        <AnimatedTotal value={total} color={player.color} />
      </div>

      {/* Score history */}
      <div className="flex-1 overflow-y-auto py-2 px-1 bg-background">
        <AnimatePresence initial={false}>
          {player.scores.map((score, idx) => {
            const isCurrent = idx === lastIdx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`mb-1 mx-1 rounded-md px-2 py-1.5 text-center cursor-pointer transition-colors ${
                  isCurrent ? "bg-card border border-border" : "hover:bg-card/50"
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

      {/* Add score button */}
      <div className="flex-shrink-0 p-2 bg-background border-t border-border">
        <button
          onClick={onAddScore}
          className="w-full h-9 rounded-md flex items-center justify-center transition-colors active:scale-95"
          style={{ backgroundColor: `${player.color}18`, color: player.color }}
          aria-label={`Add score for ${player.name}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
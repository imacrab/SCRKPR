import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Check } from "lucide-react";

export default function PlayerColumn({ player, onAddScore, onEditScore, onEditName }) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(player.name);
  const nameInputRef = useRef(null);

  const total = player.scores.reduce((s, n) => s + n, 0);
  const lastIdx = player.scores.length - 1;

  const saveName = () => {
    const trimmed = nameVal.trim();
    if (trimmed) onEditName(trimmed);
    else setNameVal(player.name);
    setEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") saveName();
  };

  return (
    <div className="h-full flex flex-col border-r border-border/40 last:border-r-0">
      {/* Header */}
      <div
        className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-1 border-b border-border/40"
        style={{ background: "linear-gradient(160deg, hsl(30,35%,99%), hsl(28,28%,93%))" }}
      >
        {editingName ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value.slice(0, 20))}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="flex-1 text-xs font-semibold text-center bg-white/80 rounded-lg border border-primary/30 px-1 py-1 outline-none min-w-0"
              maxLength={20}
            />
            <button onClick={saveName} className="text-primary flex-shrink-0">
              <Check size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 30); }}
            className="flex items-center gap-1 group"
          >
            <span className="text-xs font-bold text-foreground/80 truncate max-w-[70px] text-center leading-tight">
              {player.name}
            </span>
            <Pencil size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}

        {/* Total score */}
        <span className="font-display text-2xl font-bold text-gradient leading-none">{total}</span>
      </div>

      {/* Score history */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        <AnimatePresence initial={false}>
          {player.scores.map((score, idx) => {
            const isCurrent = idx === lastIdx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.7, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`mb-1.5 mx-1 rounded-xl px-2 py-2 text-center cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-white shadow-sm border border-primary/20"
                    : "bg-transparent"
                }`}
                onClick={() => onEditScore(idx)}
              >
                <span
                  className={`text-sm font-semibold block leading-none ${
                    isCurrent ? "text-gradient" : "text-muted-foreground/50 text-xs"
                  }`}
                >
                  {score > 0 ? `+${score}` : score}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add score button */}
      <div className="flex-shrink-0 p-2">
        <button
          onClick={onAddScore}
          className="w-full h-10 rounded-xl gradient-warm text-white flex items-center justify-center shadow-sm shadow-primary/20 active:scale-95 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
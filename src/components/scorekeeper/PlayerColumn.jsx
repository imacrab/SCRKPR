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
    <div className="h-full flex flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-1"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
      >
        {editingName ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value.slice(0, 20))}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="flex-1 text-xs font-semibold text-center rounded-lg px-1 py-1 outline-none min-w-0 text-white"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              maxLength={20}
            />
            <button onClick={saveName} className="text-primary flex-shrink-0" aria-label="Save name">
              <Check size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 30); }}
            className="flex items-center gap-1 group"
            aria-label={`Edit name: ${player.name}`}
          >
            <span className="text-xs font-bold text-[#e0e0e0] truncate max-w-[70px] text-center leading-tight">
              {player.name}
            </span>
            <Pencil size={10} className="text-[#a8a8a8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
                className="mb-1.5 mx-1 rounded-xl px-2 py-2 text-center cursor-pointer transition-all"
                style={isCurrent ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" } : {}}
                onClick={() => onEditScore(idx)}
                role="button"
                aria-label={`Edit score: ${score}`}
              >
                <span
                  className={`font-semibold block leading-none ${
                    isCurrent ? "text-sm text-gradient" : "text-xs text-[#5a5a5e]"
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
          className="w-full h-10 rounded-xl gradient-warm text-white flex items-center justify-center active:scale-95 transition-transform"
          aria-label={`Add score for ${player.name}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
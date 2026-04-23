import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Check } from "lucide-react";
import { PLAYER_COLORS } from "./PlayerSetup";

export default function PlayerColumn({ player, onAddScore, onEditScore, onEditName, onEditColor }) {
  const [editingName, setEditingName] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [nameVal, setNameVal] = useState(player.name);
  const nameInputRef = useRef(null);

  const total = player.scores.reduce((s, n) => s + n, 0);
  const lastIdx = player.scores.length - 1;

  const saveName = () => {
    const trimmed = nameVal.trim();
    if (trimmed) onEditName(trimmed);
    else setNameVal(player.name);
    setEditingName(false);
    setShowColors(false);
  };

  return (
    <div className="h-full flex flex-col border-r border-border last:border-r-0">
      {/* Header */}
      <div className="flex-shrink-0 px-2 py-3 flex flex-col items-center gap-1 bg-card border-b border-border">
        {editingName ? (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center gap-1 w-full">
              {/* Color swatch */}
              <button
                onPointerDown={(e) => { e.preventDefault(); setShowColors(!showColors); }}
                className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20 active:scale-90 transition-transform"
                style={{ backgroundColor: player.color }}
              />
              <input
                ref={nameInputRef}
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value.slice(0, 20))}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                autoFocus
                className="flex-1 text-xs font-semibold text-center rounded-md px-1 py-1 outline-none min-w-0 bg-secondary text-foreground border border-border"
                maxLength={20}
              />
              <button onClick={saveName} className="flex-shrink-0" style={{ color: player.color }}>
                <Check size={13} />
              </button>
            </div>
            {/* Inline color picker */}
            <AnimatePresence>
              {showColors && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1 pt-1">
                    {PLAYER_COLORS.map((c) => (
                      <button
                        key={c}
                        onPointerDown={(e) => { e.preventDefault(); onEditColor(c); setShowColors(false); }}
                        className="w-5 h-5 rounded-full active:scale-90 transition-transform"
                        style={{ backgroundColor: c, outline: player.color === c ? "2px solid white" : "none", outlineOffset: "2px" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 30); }}
            className="flex items-center gap-1 group"
          >
            <span className="text-xs font-bold text-foreground truncate max-w-[70px] text-center leading-tight">
              {player.name}
            </span>
            <Pencil size={9} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}

        {/* Total */}
        <span className="font-display text-2xl font-bold leading-none" style={{ color: player.color }}>{total}</span>
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
                  className={`font-semibold block leading-none text-xs ${!isCurrent ? "text-muted-foreground" : ""}`}
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
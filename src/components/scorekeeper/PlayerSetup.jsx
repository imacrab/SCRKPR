import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play } from "lucide-react";

export default function PlayerSetup({ onStart }) {
  const [names, setNames] = useState(["", ""]);

  const addPlayer = () => {
    if (names.length < 20) setNames([...names, ""]);
  };

  const removePlayer = (i) => {
    if (names.length > 2) setNames(names.filter((_, idx) => idx !== i));
  };

  const updateName = (i, val) => {
    const updated = [...names];
    updated[i] = val;
    setNames(updated);
  };

  const canStart = names.filter((n) => n.trim()).length >= 2;

  const handleStart = () => {
    const valid = names.filter((n) => n.trim());
    if (valid.length >= 2) onStart(valid);
  };

  return (
    <div className="min-h-screen app-bg flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-8 px-6 text-center">
        <h1 className="font-display text-4xl text-gradient font-bold mb-2">ScorKeep</h1>
        <p className="text-[#a8a8a8] text-sm font-medium tracking-wide">Add your players to get started</p>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <AnimatePresence>
          {names.map((name, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-3 mb-3"
            >
              <div className="w-8 h-8 rounded-full gradient-warm flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <input
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                maxLength={20}
                className="flex-1 rounded-xl h-11 px-3 text-sm font-medium outline-none transition-colors text-white placeholder:text-[#6b6b6f]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
              />
              {names.length > 2 && (
                <button
                  onClick={() => removePlayer(i)}
                  className="w-8 h-8 flex items-center justify-center text-[#a8a8a8] hover:text-red-400 transition-colors"
                  aria-label="Remove player"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {names.length < 20 && (
          <button
            onClick={addPlayer}
            className="w-full mt-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[#a8a8a8] hover:text-white text-sm font-medium transition-all"
            style={{ border: "2px dashed rgba(255,255,255,0.12)" }}
          >
            <Plus size={16} />
            Add Player
          </button>
        )}
      </div>

      {/* Start button */}
      <div className="px-5 pb-12 pt-4">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-14 rounded-2xl text-base font-semibold gradient-warm text-white shadow-lg disabled:opacity-30 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play size={18} />
          Start Game
        </button>
      </div>
    </div>
  );
}
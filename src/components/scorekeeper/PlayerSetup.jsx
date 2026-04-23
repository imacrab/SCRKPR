import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-8 px-6 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground mb-1">
          Scor<span className="text-accent-blue">Keep</span>
        </h1>
        <p className="text-muted-foreground text-sm">Add players to get started</p>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        <AnimatePresence>
          {names.map((name, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <Input
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                maxLength={20}
                className="flex-1 bg-card border-border text-foreground placeholder:text-muted-foreground h-11"
              />
              {names.length > 2 && (
                <button
                  onClick={() => removePlayer(i)}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-accent-red transition-colors"
                  aria-label="Remove player"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {names.length < 20 && (
          <button
            onClick={addPlayer}
            className="w-full mt-1 h-11 rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors border border-dashed border-border hover:border-accent-blue/50"
          >
            <Plus size={15} />
            Add Player
          </button>
        )}
      </div>

      {/* Start button */}
      <div className="px-5 pb-12 pt-4">
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-13 text-base font-semibold bg-accent-blue hover:bg-accent-blue/90 text-background"
          style={{ height: "52px" }}
        >
          <Play size={16} className="mr-2" />
          Start Game
        </Button>
      </div>
    </div>
  );
}
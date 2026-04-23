import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const PLAYER_COLORS = [
  "#2DC5F8", // sky blue
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#A855F7", // purple
  "#EC4899", // pink
  "#FF3A3A", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#EAB308", // yellow
  "#84CC16", // lime
  "#22C55E", // green
  "#10B981", // emerald
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#0EA5E9", // light blue
  "#64748B", // slate
  "#A78BFA", // lavender
  "#FB7185", // rose
  "#34D399", // mint
];

const DEFAULT_COLOR_IDX = 0;

function ColorPicker({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {PLAYER_COLORS.map((color) => (
        <button
          key={color}
          onPointerDown={(e) => { e.preventDefault(); onChange(color); }}
          className="w-6 h-6 rounded-full transition-transform active:scale-90 flex items-center justify-center"
          style={{ backgroundColor: color, outline: selected === color ? `2px solid white` : "none", outlineOffset: "2px" }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}

export default function PlayerSetup({ onStart }) {
  const [players, setPlayers] = useState([
    { name: "", color: PLAYER_COLORS[0] },
    { name: "", color: PLAYER_COLORS[1] },
  ]);
  const [expandedColor, setExpandedColor] = useState(null);

  const addPlayer = () => {
    if (players.length < 20) {
      setPlayers([...players, { name: "", color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] }]);
    }
  };

  const removePlayer = (i) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, idx) => idx !== i));
      if (expandedColor === i) setExpandedColor(null);
    }
  };

  const updateName = (i, val) => {
    const updated = [...players];
    updated[i] = { ...updated[i], name: val };
    setPlayers(updated);
  };

  const updateColor = (i, color) => {
    const updated = [...players];
    updated[i] = { ...updated[i], color };
    setPlayers(updated);
    setExpandedColor(null);
  };

  const canStart = players.filter((p) => p.name.trim()).length >= 2;

  const handleStart = () => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length >= 2) onStart(valid);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-8 px-6 text-center">
        <h1 className="font-sans font-medium text-4xl text-foreground mb-1">
          Scorkeepr
        </h1>
        <p className="text-muted-foreground text-sm">Add players to get started</p>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        <AnimatePresence>
          {players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                {/* Color swatch / toggle */}
                <button
                  onPointerDown={(e) => { e.preventDefault(); setExpandedColor(expandedColor === i ? null : i); }}
                  className="w-7 h-7 rounded-full flex-shrink-0 transition-transform active:scale-90 border-2 border-white/20"
                  style={{ backgroundColor: player.color }}
                  aria-label="Pick color"
                />
                <Input
                  value={player.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  maxLength={20}
                  className="flex-1 bg-transparent border-none shadow-none h-9 px-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-accent-red transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Color picker drawer */}
              <AnimatePresence>
                {expandedColor === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border px-3 pb-3"
                  >
                    <ColorPicker selected={player.color} onChange={(c) => updateColor(i, c)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {players.length < 20 && (
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
          className="w-full h-13 text-base font-semibold bg-white hover:bg-white/90 text-background"
          style={{ height: "52px", color: "#111" }}
        >
          <Play size={16} className="mr-2" />
          Start Game
        </Button>
      </div>
    </div>
  );
}
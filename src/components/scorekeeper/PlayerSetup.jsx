import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play, Users, History, Save, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import SaveGroupModal from "./SaveGroupModal";

export const PLAYER_COLORS = [
  "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#FF3A3A", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#64748B", "#A78BFA", "#FB7185", "#34D399",
];

function ColorPicker({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {PLAYER_COLORS.map((color) => (
        <button
          key={color}
          onPointerDown={(e) => { e.preventDefault(); onChange(color); }}
          className="w-6 h-6 rounded-full transition-transform active:scale-90"
          style={{ backgroundColor: color, outline: selected === color ? "2px solid white" : "none", outlineOffset: "2px" }}
        />
      ))}
    </div>
  );
}

export default function PlayerSetup({ onStart, onShowHistory }) {
  const [players, setPlayers] = useState([
    { name: "", color: PLAYER_COLORS[0] },
    { name: "", color: PLAYER_COLORS[1] },
  ]);
  const [expandedColor, setExpandedColor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [winMode, setWinMode] = useState("high"); // "high" | "low"

  useEffect(() => {
    base44.entities.PlayerGroup.list("-created_date", 20).then(setGroups);
  }, []);

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

  const handleSaveGroup = async (groupName) => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < 2) return;
    const group = await base44.entities.PlayerGroup.create({ name: groupName, players: valid });
    setGroups((prev) => [group, ...prev]);
    setShowSaveGroup(false);
  };

  const deleteGroup = async (id) => {
    await base44.entities.PlayerGroup.delete(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const loadGroup = (group) => {
    setPlayers(group.players.map((p) => ({ name: p.name, color: p.color })));
    setExpandedColor(null);
  };

  const canStart = players.filter((p) => p.name.trim()).length >= 2;
  const hasValidPlayers = players.filter((p) => p.name.trim()).length >= 2;

  const handleStart = () => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length >= 2) onStart(valid, winMode);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-5 px-6 flex items-center justify-between">
        <h1 className="font-sans font-medium text-4xl text-foreground">Scorkeepr</h1>
        <button onClick={onShowHistory} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <History size={18} />
        </button>
      </div>

      {/* Saved Groups */}
      {groups.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Saved Groups</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map((g) => (
              <div key={g.id} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border">
                <button onClick={() => loadGroup(g)} className="flex items-center gap-1.5">
                  <Users size={12} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{g.name}</span>
                  <span className="text-xs text-muted-foreground">({g.players.length})</span>
                </button>
                <button onClick={() => deleteGroup(g.id)} className="text-muted-foreground hover:text-accent-red transition-colors ml-1">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <button
                  onPointerDown={(e) => { e.preventDefault(); setExpandedColor(expandedColor === i ? null : i); }}
                  className="w-7 h-7 rounded-full flex-shrink-0 transition-transform active:scale-90 border-2 border-white/20"
                  style={{ backgroundColor: player.color }}
                />
                <Input
                  value={player.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  maxLength={20}
                  className="flex-1 bg-transparent border-none shadow-none h-9 px-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
                {players.length > 2 && (
                  <button onClick={() => removePlayer(i)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
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

      {/* Win mode */}
      <div className="px-5 pt-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Win Condition</p>
        <div className="flex gap-2">
          {[
            { value: "high", label: "High Score", Icon: Trophy },
            { value: "low",  label: "Low Score",  Icon: Target },
          ].map((opt) => {
            const active = winMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setWinMode(opt.value)}
                className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: active ? "rgba(255,255,255,0.5)" : "hsl(var(--border))",
                  backgroundColor: active ? "hsl(var(--card))" : "transparent",
                }}
              >
                <opt.Icon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                />
                <span className="text-sm font-medium" style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-12 pt-2 flex flex-col gap-2">
        {hasValidPlayers && (
          <Button
            onClick={() => setShowSaveGroup(true)}
            variant="outline"
            className="w-full h-10 text-sm text-muted-foreground"
          >
            <Save size={13} className="mr-1.5" />
            Save as Group
          </Button>
        )}
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full text-base font-semibold bg-white hover:bg-white/90"
          style={{ height: "52px", color: "#111" }}
        >
          <Play size={16} className="mr-2" />
          Start Game
        </Button>
      </div>

      <SaveGroupModal
        isOpen={showSaveGroup}
        onSave={handleSaveGroup}
        onClose={() => setShowSaveGroup(false)}
      />
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmojiPicker from "./EmojiPicker";

const PLAYER_COLORS = [
  "#FF3A3A", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#9CA3AF", "#6B7280", "#374151", "#FFFFFF", "#000000",
];

function pickRandomColor(usedColors = []) {
  const used = new Set(usedColors);
  const available = PLAYER_COLORS.filter((c) => !used.has(c));
  const pool = available.length > 0 ? available : PLAYER_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PlayerEditModal({ isOpen, player, usedColors = [], onSave, onDelete, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PLAYER_COLORS[0]);
  const [emoji, setEmoji] = useState("");
  const inputRef = useRef(null);
  const isEditing = !!player?.id;

  useEffect(() => {
    if (!isOpen) return;
    if (player?.id) {
      setName(player.name || "");
      setColor(player.color || PLAYER_COLORS[0]);
      setEmoji(player.emoji || "");
    } else {
      setName("");
      setColor(pickRandomColor(usedColors));
      setEmoji("");
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, player, usedColors]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ id: player?.id, name: trimmed, color, emoji });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed inset-0 z-50 bg-card flex flex-col"
        >
          {/* Sticky header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-5 border-b border-border"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: "12px" }}
          >
            <button
              onClick={onClose}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2} />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {isEditing ? "Edit Player" : "New Player"}
              </p>
              <h2 className="font-display text-lg font-bold text-foreground leading-tight">
                {isEditing ? "Update Details" : "Add Player"}
              </h2>
            </div>
            <div className="w-10" />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">
            <Input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
              placeholder="Player name"
              maxLength={20}
              className="mb-5 text-center text-base bg-secondary border-border"
            />

            <div className="mb-3">
              <EmojiPicker selected={emoji} onChange={setEmoji} />
            </div>

            <div className="border-t border-border">
              <div className="grid grid-cols-5 gap-3 p-3 justify-items-center">
                {PLAYER_COLORS.map((c) => (
                  <button
                    key={c}
                    onPointerDown={(e) => { e.preventDefault(); setColor(c); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform active:scale-90"
                    style={{ backgroundColor: c, outline: color === c ? "2px solid white" : "none", outlineOffset: "2px" }}
                  >
                    {color === c ? emoji : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div
            className="flex-shrink-0 px-5 pt-3 border-t border-border bg-card"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <div className="flex gap-3">
              {isEditing && (
                <Button
                  onClick={() => onDelete?.(player.id)}
                  variant="outline"
                  className="h-11 text-accent-red border-accent-red/40"
                >
                  <Trash2 size={20} strokeWidth={2} />
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="flex-1 h-11 bg-white hover:bg-white/90 font-semibold"
                style={{ color: "#111" }}
              >
                {isEditing ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
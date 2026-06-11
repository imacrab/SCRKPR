import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomSheetModal from "./BottomSheetModal";
import EmojiPicker from "./EmojiPicker";
import FluentEmoji from "./FluentEmoji";
import DeletePlayerConfirmModal from "./DeletePlayerConfirmModal";
import { getPaletteForTone, readableTextColor } from "@/lib/contrast";
import { usePlayerTone } from "@/lib/usePlayerTone";

function pickRandomColor(palette, usedColors = []) {
  const used = new Set(usedColors);
  const available = palette.filter((c) => !used.has(c));
  const pool = available.length > 0 ? available : palette;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PlayerEditModal({ isOpen, player, usedColors = [], onSave, onDelete, onClose }) {
  const [tone] = usePlayerTone();
  const palette = useMemo(() => getPaletteForTone(tone), [tone]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [emoji, setEmoji] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef(null);
  const isEditing = !!player?.id;

  useEffect(() => {
    if (!isOpen) return;
    if (player?.id) {
      setName(player.name || "");
      setColor(player.color || palette[0]);
      setEmoji(player.emoji || "");
    } else {
      setName("");
      setColor(pickRandomColor(palette, usedColors));
      setEmoji("");
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, player, usedColors, palette]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ id: player?.id, name: trimmed, color, emoji });
  };

  return (
    <>
      <BottomSheetModal
        isOpen={isOpen}
        onClose={onClose}
        eyebrow={isEditing ? "Edit Player" : "New Player"}
        title={isEditing ? "Update Details" : "Add Player"}
        scrollable
        footer={
          <div className="flex gap-3">
            {isEditing && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="h-11 bg-accent-red/15 hover:bg-accent-red/25 text-accent-red border-0 shadow-none"
              >
                <FluentEmoji emoji="🗑️" size={20} />
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
        }
      >
        <div className="pb-3">
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
            placeholder="Player name"
            maxLength={20}
            className="mb-3 text-center text-base bg-secondary border-border"
          />

          <div className="grid grid-cols-5 gap-3 p-3 justify-items-center">
            {palette.map((c) => (
              <button
                key={c}
                onPointerDown={(e) => { e.preventDefault(); setColor(c); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ backgroundColor: c, color: readableTextColor(c), outline: color === c ? "2px solid hsl(var(--foreground))" : "none", outlineOffset: "2px" }}
              >
                {color === c && emoji ? <FluentEmoji emoji={emoji} size={24} /> : ""}
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-2">
            <EmojiPicker selected={emoji} onChange={setEmoji} />
          </div>
        </div>
      </BottomSheetModal>

      <DeletePlayerConfirmModal
        isOpen={showDeleteConfirm}
        playerName={player?.name}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.(player.id);
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
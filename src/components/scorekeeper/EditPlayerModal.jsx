import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmojiPicker from "./EmojiPicker";
import BottomSheetModal from "./BottomSheetModal";

const PLAYER_COLORS = [
  "#FF3A3A", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#9CA3AF", "#6B7280", "#374151", "#FFFFFF", "#000000",
];

export default function EditPlayerModal({ player, isOpen, onSave, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [emoji, setEmoji] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && player) {
      setName(player.name);
      setColor(player.color);
      setEmoji(player.emoji || "");
      setTimeout(() => { inputRef.current?.select(); }, 120);
    }
  }, [isOpen, player]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color, emoji });
  };

  if (!player) return null;

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Edit Player"
      title="Name & Color"
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 h-11 bg-white hover:bg-white/90 font-semibold"
            style={{ color: "#111" }}
          >
            Save
          </Button>
        </div>
      }
    >
      {/* Name input with color dot */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white/20 flex items-center justify-center text-base leading-none"
          style={{ backgroundColor: color }}
        >
          {emoji}
        </div>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          placeholder="Player name"
          maxLength={20}
          className="flex-1 text-base bg-secondary border-border"
        />
      </div>

      {/* Emoji picker */}
      <div className="mb-1">
        <EmojiPicker selected={emoji} onChange={setEmoji} />
      </div>

      {/* Color picker */}
      <div className="border-t border-border grid grid-cols-5 gap-3 p-3 pb-2 justify-items-center">
        {PLAYER_COLORS.map((c) => (
          <button
            key={c}
            onPointerDown={(e) => { e.preventDefault(); setColor(c); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform active:scale-90"
            style={{
              backgroundColor: c,
              outline: color === c ? "2.5px solid white" : "none",
              outlineOffset: "2px",
            }}
          >
            {color === c ? emoji : ""}
          </button>
        ))}
      </div>
    </BottomSheetModal>
  );
}
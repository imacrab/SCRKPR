import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomSheetModal from "./BottomSheetModal";
import EmojiPicker, { AUTOFILL_EMOJIS } from "./EmojiPicker";
import DeletePlayerConfirmModal from "./DeletePlayerConfirmModal";
import { Check, Trash2 } from "lucide-react";
import { NEO_COLORS, PLAYER_COLORS, toNeoColor, twoToneBackground } from "@/lib/colors";
import { PlayerTile, SectionLabel, SegmentedControl } from "./neo";

const STYLE_TABS = [
  { id: "color", label: "Color" },
  { id: "emoji", label: "Emoji" },
];

function pickRandomUnused(options, used = []) {
  const taken = new Set(used);
  const available = options.filter((o) => !taken.has(o));
  const pool = available.length > 0 ? available : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PlayerEditModal({ isOpen, player, usedColors = [], usedEmojis = [], onSave, onDelete, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PLAYER_COLORS[0]);
  const [emoji, setEmoji] = useState("");
  const [cardStyle, setCardStyle] = useState("solid"); // "solid" | "gradient"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [styleTab, setStyleTab] = useState("color"); // "color" | "emoji"
  const inputRef = useRef(null);
  const isEditing = !!player?.id;


  // iOS only surfaces the software keyboard when focus() runs synchronously
  // inside the user-gesture task that opened the sheet. A setTimeout — or any
  // await/rAF — moves us out of that task and iOS silently blocks the keyboard
  // (focus still applies, so on desktop it "worked"). A ref callback fires
  // synchronously the moment the <input> mounts, which happens in the same
  // task as the tap that flipped isOpen — the one window iOS accepts.
  const setInputRef = useCallback((el) => {
    inputRef.current = el;
    if (el && isOpen) {
      el.focus();
      try { el.select(); } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (player?.id) {
      setName(player.name || "");
      setColor(toNeoColor(player.color));
      setEmoji(player.emoji || "");
      setCardStyle(player.cardStyle === "gradient" ? "gradient" : "solid");
    } else {
      setName("");
      setColor(pickRandomUnused(PLAYER_COLORS, usedColors.map(toNeoColor)));
      setEmoji(pickRandomUnused(AUTOFILL_EMOJIS, usedEmojis));
      setCardStyle("solid");
    }
    // Focus is handled by setInputRef synchronously on mount — see comment
    // above. Do not add a setTimeout here or iOS will drop the keyboard.
  }, [isOpen, player, usedColors, usedEmojis]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ id: player?.id, name: trimmed, color, emoji, cardStyle });
  };

  return (
    <>
      <BottomSheetModal
        isOpen={isOpen}
        onClose={onClose}
        eyebrow={isEditing ? "Edit Player" : "New Player"}
        title={isEditing ? "Update Details" : "Add Player"}
        scrollable
        fullHeight
        footer={
          <div className="flex gap-3.5">
            {isEditing && onDelete && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete player"
                variant="destructive"
                size="icon"
              >
                <Trash2 size={22} strokeWidth={2.5} />
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={!name.trim()} className="flex-1">
              {isEditing ? "Save" : "Add player"}
            </Button>
          </div>
        }
      >
        {/* Fixed-height layout: the tab panel fills the remaining space so the
            sheet doesn't jump when switching between Color and Emoji. */}
        <div className="flex flex-col h-full min-h-0">
          <div
            className="mr-1 h-16 flex-shrink-0 flex items-center gap-3 px-3 border-3 border-ink rounded-[14px] shadow-neo"
            style={{ background: cardStyle === "gradient" ? twoToneBackground(color) : color }}
          >
            <PlayerTile emoji={emoji} color="#FFFFFF" size={42} radius={10} />
            <span className={`flex-1 min-w-0 truncate text-xl font-extrabold ${name.trim() ? "" : "opacity-50"}`}>{name.trim() || "Player name"}</span>
            <span className="font-mono text-[10px] font-bold tracking-[0.12em]">PREVIEW</span>
          </div>

          <SectionLabel as="label" htmlFor="player-name" className="mt-4 text-[11px] flex-shrink-0">Name</SectionLabel>
          <Input
            id="player-name"
            ref={setInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
            placeholder="Player name"
            maxLength={20}
            className="mt-1.5 w-[calc(100%-4px)] flex-shrink-0"
          />

          <SegmentedControl className="mt-4 mr-1 flex-shrink-0" options={STYLE_TABS} value={styleTab} onChange={setStyleTab} />

          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pt-3.5 pb-2">
            {styleTab === "color" ? (
              <>
                <div className="grid grid-cols-2 gap-3 mr-1">
                  {[
                    { id: "solid", label: "Solid" },
                    { id: "gradient", label: "Two-tone" },
                  ].map(({ id, label }) => {
                    const active = cardStyle === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onPointerDown={(e) => { e.preventDefault(); setCardStyle(id); }}
                        className="h-14 flex items-end px-3 pb-2 border-3 border-ink rounded-xl text-[15px] font-extrabold transition-shadow"
                        style={{
                          background: id === "solid" ? color : twoToneBackground(color, 50),
                          boxShadow: active ? "3px 3px 0 rgb(var(--ink))" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <SectionLabel className="mt-4 text-[11px]">Color</SectionLabel>
                <div className="mt-2 mr-1 grid grid-cols-5 gap-2.5">
                  {NEO_COLORS.map(({ name: swatchName, hex }) => {
                    const active = color === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        aria-label={swatchName}
                        aria-pressed={active}
                        onPointerDown={(e) => { e.preventDefault(); setColor(hex); }}
                        className="aspect-square flex items-center justify-center border-3 border-ink rounded-xl transition-[transform,box-shadow] duration-100"
                        style={{
                          background: hex,
                          boxShadow: active ? "3px 3px 0 rgb(var(--ink))" : "none",
                          transform: active ? "translate(-2px, -2px)" : "none",
                        }}
                      >
                        {active && <Check size={20} strokeWidth={3.5} />}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmojiPicker selected={emoji} onChange={setEmoji} />
            )}
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
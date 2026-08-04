import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomSheetModal from "./BottomSheetModal";
import EmojiPicker, { AUTOFILL_EMOJIS } from "./EmojiPicker";
import FluentEmoji from "./FluentEmoji";
import StretchTabPill from "./StretchTabPill";
import DeletePlayerConfirmModal from "./DeletePlayerConfirmModal";
import { Trash2 } from "lucide-react";
import { getPaletteForTone, readableTextColor, toLightBg } from "@/lib/contrast";
import { usePlayerTone } from "@/lib/usePlayerTone";

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
  const [tone] = usePlayerTone();
  const palette = useMemo(() => getPaletteForTone(tone), [tone]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [emoji, setEmoji] = useState("");
  const [cardStyle, setCardStyle] = useState("solid"); // "solid" | "gradient"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [styleTab, setStyleTab] = useState("color"); // "color" | "emoji"
  const [previousStyleTab, setPreviousStyleTab] = useState("color");
  const inputRef = useRef(null);
  const isEditing = !!player?.id;

  const styleTabIndex = STYLE_TABS.findIndex((t) => t.id === styleTab);
  const previousStyleTabIndex = STYLE_TABS.findIndex((t) => t.id === previousStyleTab);
  const handleStyleTabChange = (id) => {
    if (id === styleTab) return;
    setPreviousStyleTab(styleTab);
    setStyleTab(id);
  };

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
      // In light tone, brighten a legacy dark color so editing lightens the
      // player (and the pre-selected swatch matches the light palette).
      const stored = player.color || palette[0];
      const needsLightening = tone === "light" && readableTextColor(stored) === "#FFFFFF";
      setColor(needsLightening ? toLightBg(stored) : stored);
      setEmoji(player.emoji || "");
      setCardStyle(player.cardStyle === "gradient" ? "gradient" : "solid");
    } else {
      setName("");
      setColor(pickRandomUnused(palette, usedColors));
      setEmoji(pickRandomUnused(AUTOFILL_EMOJIS, usedEmojis));
      setCardStyle("solid");
    }
    // Focus is handled by setInputRef synchronously on mount — see comment
    // above. Do not add a setTimeout here or iOS will drop the keyboard.
  }, [isOpen, player, usedColors, usedEmojis, palette, tone]);

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
          <div className="flex gap-3">
            {isEditing && onDelete && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete player"
                className="h-11 w-11 flex-shrink-0 bg-accent-red/15 hover:bg-accent-red/25 text-accent-red border-0 shadow-none"
              >
                <Trash2 size={18} strokeWidth={2} />
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="flex-1 h-11 bg-white hover:bg-white/90 font-semibold"
              style={{ color: "#111111" }}
            >
              {isEditing ? "Save" : "Add"}
            </Button>
          </div>
        }
      >
        {/* Full-height layout: input + tabs are fixed at the top; the tab
            panel below fills the remaining space so the sheet height is
            constant whether Color or Emoji is active — no jump on switch. */}
        <div className="pt-1 pb-3 flex flex-col h-full min-h-0">
          <Input
            ref={setInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
            placeholder="Player name"
            maxLength={20}
            className="mb-3 h-11 text-center text-base bg-secondary border-border flex-shrink-0"
          />

          <div className="px-1 pt-1 pb-2 flex-shrink-0">
            <div className="relative flex rounded-full bg-secondary border border-border p-1">
              <StretchTabPill
                activeIndex={styleTabIndex}
                previousIndex={previousStyleTabIndex}
                onSettle={() => setPreviousStyleTab(styleTab)}
              />
              {STYLE_TABS.map(({ id, label }) => {
                const active = styleTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleStyleTabChange(id)}
                    className="relative flex-1 h-9 rounded-full text-sm font-medium"
                  >
                    <span className={`relative z-10 inline-flex items-center gap-1.5 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {styleTab === "color" ? (
              <div className="p-3 space-y-4">
                {/* Card style — Solid vs Gradient. Each tile previews the look
                    using the currently-selected color, so the choice reads at a
                    glance and updates live as a new swatch is picked. */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "solid", label: "Solid" },
                    { id: "gradient", label: "Gradient" },
                  ].map(({ id, label }) => {
                    const active = cardStyle === id;
                    const previewStyle = id === "solid"
                      ? { backgroundColor: color }
                      : {
                          background: `linear-gradient(150deg, ${color}40 0%, ${color}14 40%, hsl(var(--card)) 78%)`,
                          border: `1px solid ${color}66`,
                        };
                    const labelColor = id === "solid" ? readableTextColor(color) : "hsl(var(--foreground))";
                    return (
                      <button
                        key={id}
                        type="button"
                        onPointerDown={(e) => { e.preventDefault(); setCardStyle(id); }}
                        className="relative h-14 rounded-xl overflow-hidden flex items-end p-2.5 transition-transform active:scale-95"
                        style={{ ...previewStyle, outline: active ? "2px solid hsl(var(--foreground))" : "none", outlineOffset: "2px" }}
                      >
                        {id === "solid" && emoji && (
                          <span className="absolute top-1.5 right-2 opacity-90"><FluentEmoji emoji={emoji} size={18} /></span>
                        )}
                        <span className="text-xs font-semibold" style={{ color: labelColor }}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Color swatches */}
                <div className="grid grid-cols-5 gap-3 justify-items-center">
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
              </div>
            ) : (
              <div className="pt-2">
                <EmojiPicker selected={emoji} onChange={setEmoji} />
              </div>
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
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomSheetModal from "./BottomSheetModal";
import IconPicker from "./IconPicker";
import { AUTOFILL_ICONS, toIconId } from "@/lib/playerIcons";
import DeletePlayerConfirmModal from "./DeletePlayerConfirmModal";
import { Check, Trash2 } from "lucide-react";
import { NEO_COLORS, PLAYER_COLORS, toNeoColor, twoToneBackground } from "@/lib/colors";
import { PlayerTile, SectionLabel, SegmentedControl } from "./neo";

const SCROLL_AREA = "flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-2";

const STYLE_TABS = [
  { id: "color", label: "Color" },
  { id: "icon", label: "Icon" },
];

function pickRandomUnused(options, used = []) {
  const taken = new Set(used);
  const available = options.filter((o) => !taken.has(o));
  const pool = available.length > 0 ? available : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function initialPlayerDraft(player, usedColors = [], usedEmojis = []) {
  if (player?.id) {
    return {
      name: player.name || "",
      color: toNeoColor(player.color),
      emoji: toIconId(player.emoji),
      cardStyle: player.cardStyle === "gradient" ? "gradient" : "solid",
    };
  }
  return {
    name: "",
    color: pickRandomUnused(PLAYER_COLORS, usedColors.map(toNeoColor)),
    emoji: pickRandomUnused(AUTOFILL_ICONS, usedEmojis.map(toIconId)),
    cardStyle: "solid",
  };
}

export function PlayerEditFields({ draft, onChange, inputRef, onSubmit, onEscape, wide = false }) {
  const [styleTab, setStyleTab] = useState("color"); // "color" | "icon"
  const { name, color, emoji, cardStyle } = draft;

  const nameInput = (
    <Input
      id="player-name"
      ref={inputRef}
      type="text"
      value={name}
      onChange={(e) => onChange({ name: e.target.value.slice(0, 20) })}
      onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onEscape?.(); }}
      placeholder="Player name"
      maxLength={20}
      className={wide ? "flex-1 min-w-0" : "mt-1.5 w-[calc(100%-4px)] flex-shrink-0"}
    />
  );
  const styleTabs = (
    <SegmentedControl className={wide ? "w-[220px] flex-shrink-0 mr-1" : "relative z-10 mt-4 mr-1 flex-shrink-0"} height={wide ? 52 : 44} options={STYLE_TABS} value={styleTab} onChange={setStyleTab} />
  );

  return (
    // Fixed-height layout: the tab panel fills the remaining space so the
    // sheet doesn't jump when switching between Color and Icon.
    <div className="flex flex-col h-full min-h-0">
      {!wide && (
        <div
          className="mr-1 h-16 flex-shrink-0 flex items-center gap-3 px-3 text-ink border-3 border-ink rounded-[14px] shadow-neo"
          style={{ background: cardStyle === "gradient" ? twoToneBackground(color) : color }}
        >
          <PlayerTile icon={emoji} color="#FFFFFF" size={42} radius={10} />
          <span className={`flex-1 min-w-0 truncate text-xl font-extrabold ${name.trim() ? "" : "opacity-50"}`}>{name.trim() || "Player name"}</span>
          <span className="font-mono text-[10px] font-bold tracking-[0.12em]">PREVIEW</span>
        </div>
      )}

      <SectionLabel as="label" htmlFor="player-name" className={`${wide ? "" : "mt-4"} text-[11px] flex-shrink-0`}>Name</SectionLabel>
      {wide ? (
        <div className="mt-2 flex items-center gap-4 flex-shrink-0">
          {nameInput}
          {styleTabs}
        </div>
      ) : (
        <>
          {nameInput}
          {styleTabs}
        </>
      )}

      {styleTab === "color" ? (
        // Starts at the tabs' midline so content scrolls up behind them.
        <div className={`${SCROLL_AREA} ${wide ? "pt-5" : "-mt-[22px] pt-9"}`}>
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
                  onPointerDown={(e) => { e.preventDefault(); onChange({ cardStyle: id }); }}
                  className="h-14 flex items-end px-3 pb-2 text-ink border-3 border-ink rounded-xl text-[15px] font-extrabold transition-shadow"
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
          <div className={`mt-2 mr-1 grid gap-2.5 ${wide ? "grid-cols-8" : "grid-cols-5"}`}>
            {NEO_COLORS.map(({ name: swatchName, hex }) => {
              const active = color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={swatchName}
                  aria-pressed={active}
                  onPointerDown={(e) => { e.preventDefault(); onChange({ color: hex }); }}
                  className="aspect-square flex items-center justify-center text-ink border-3 border-ink rounded-xl transition-[transform,box-shadow] duration-100"
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
        </div>
      ) : (
        <IconPicker
          selected={emoji}
          onChange={(next) => onChange({ emoji: next })}
          searchClassName={wide ? "mt-5" : "mt-3"}
          scrollAreaClassName={SCROLL_AREA}
        />
      )}
    </div>
  );
}

export default function PlayerEditModal({ isOpen, player, usedColors = [], usedEmojis = [], onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => initialPlayerDraft(player, usedColors, usedEmojis));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    setDraft(initialPlayerDraft(player, usedColors, usedEmojis));
    // Focus is handled by setInputRef synchronously on mount — see comment
    // above. Do not add a setTimeout here or iOS will drop the keyboard.
  }, [isOpen, player, usedColors, usedEmojis]);

  const handleSubmit = () => {
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    onSave({ ...draft, id: player?.id, name: trimmed });
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
            <Button variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!draft.name.trim()} className="flex-1">
              {isEditing ? "Save" : "Add player"}
            </Button>
          </div>
        }
      >
        <PlayerEditFields
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          inputRef={setInputRef}
          onSubmit={handleSubmit}
          onEscape={onClose}
        />
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

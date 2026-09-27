import { useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FluentEmoji from "./FluentEmoji";
import DeletePlayerConfirmModal from "./DeletePlayerConfirmModal";
import { PlayerEditFields, initialPlayerDraft } from "./PlayerEditModal";
import { PlayerTile, SectionLabel, WIDE_PANEL } from "./neo";
import { twoToneBackground } from "@/lib/colors";
import { primeIOSKeyboard } from "@/lib/iosKeyboardPrimer";

// Inline editor for the tablet Players page. The parent remounts it (via key)
// whenever a different player is picked, which re-seeds the draft.
export default function PlayerEditPanel({ player, usedColors, usedEmojis, onSave, onDelete, onDiscard }) {
  const [draft, setDraft] = useState(() => initialPlayerDraft(player, usedColors, usedEmojis));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEditing = !!player?.id;

  // New players get focus (and the iOS keyboard) straight away — see the
  // synchronous-focus note in PlayerEditModal.
  const focusIfNew = useCallback((el) => {
    if (el && !isEditing) el.focus();
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    onSave({ ...draft, id: player?.id, name: trimmed });
  };

  const tileBackground = draft.cardStyle === "gradient" ? twoToneBackground(draft.color) : draft.color;

  return (
    <section aria-label={isEditing ? "Edit player" : "New player"} className={`h-full flex flex-col p-7 ${WIDE_PANEL}`}>
      <div className="flex items-center gap-4 flex-shrink-0">
        <PlayerTile color={tileBackground} size={72} radius={16} rotate={-4} className="shadow-neo">
          {draft.emoji ? <FluentEmoji emoji={draft.emoji} size={50} /> : null}
        </PlayerTile>
        <div className="min-w-0">
          <SectionLabel className="text-[11px]">{isEditing ? "Edit player" : "New player"}</SectionLabel>
          <h2 className={`font-display mt-1 text-[34px] leading-[1.05] uppercase truncate ${draft.name.trim() ? "" : "opacity-40"}`}>
            {draft.name.trim() || "Player name"}
          </h2>
        </div>
      </div>

      <div className="mt-7 flex-1 min-h-0">
        <PlayerEditFields
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          inputRef={focusIfNew}
          onSubmit={handleSubmit}
          onEscape={onDiscard}
          wide
        />
      </div>

      <div className="mt-5 flex items-center gap-3.5 flex-shrink-0">
        {isEditing && onDelete && (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="px-5">
            <Trash2 size={20} strokeWidth={2.5} />
            Delete
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" onClick={onDiscard} className="px-6">
          Discard
        </Button>
        <Button onClick={handleSubmit} disabled={!draft.name.trim()} className="px-7 mr-1">
          {isEditing ? "Save" : "Add player"}
        </Button>
      </div>

      <DeletePlayerConfirmModal
        isOpen={showDeleteConfirm}
        playerName={player?.name}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.(player.id);
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </section>
  );
}

export function PlayerEditPanelEmpty({ onAdd }) {
  return (
    <div className={`h-full flex flex-col items-center justify-center text-center p-8 ${WIDE_PANEL}`}>
      <PlayerTile color="#FFD23F" size={104} radius={22} rotate={-6} className="shadow-neo-md">
        <FluentEmoji emoji="👈" size={68} />
      </PlayerTile>
      <h2 className="font-display mt-8 text-[28px] leading-[1.1] uppercase">Pick a player</h2>
      <p className="mt-2.5 text-base font-medium text-subtle max-w-[300px]">Tap anyone on the left to change their name, color, or emoji.</p>
      <Button variant="outline" onPointerDown={primeIOSKeyboard} onClick={onAdd} className="mt-7 px-7">
        <Plus size={20} strokeWidth={3} />
        Add player
      </Button>
    </div>
  );
}

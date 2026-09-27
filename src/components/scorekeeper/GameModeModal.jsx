import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlayerTile, SectionLabel } from "./neo";
import { useGameModeToggles } from "@/lib/useGameModeToggles";

// Generic scoring shapes. High/Low take an optional target score that ends the
// game when anyone reaches it — e.g. Gin = Low + 100, "Swish" = Low + 500
// (first to 500 ends it, lowest total wins). Best Of asks for a round count next.
// `optional: true` means the mode can be hidden via Settings → Game Modes.
const MODES = [
  { value: "swish", label: "Swish", emoji: "⚡", optional: true },
  { value: "ginrummy", label: "Gin Rummy", emoji: "🎴", optional: true },
  { value: "hotdice", label: "Hot Dice", emoji: "🎲", optional: true },
  { value: "phase10", label: "Phase 10", emoji: "🃏", optional: true },
  { value: "skipbo", label: "Skip-Bo", emoji: "🔢", optional: true },
  { value: "low", label: "Low Score", emoji: "📉" },
  { value: "high", label: "High Score", emoji: "📈" },
  { value: "bestof", label: "Best Of", emoji: "🏆" },
];

export default function GameModeModal({ isOpen, winMode, targetScore, onSelect, onClose }) {
  const { toggles } = useGameModeToggles();
  const visibleModes = MODES.filter((m) => !m.optional || toggles[m.value] !== false);

  const [mode, setMode] = useState(winMode || visibleModes[0]?.value || "high");
  // Only seed the target input for high/low, which actually use it. Locked
  // modes (swish/ginrummy/hotdice) carry a targetScore that shouldn't leak in
  // as a pre-filled value when the user switches to high/low.
  const seedTarget = (winMode === "high" || winMode === "low") && targetScore ? String(targetScore) : "";
  const [target, setTarget] = useState(seedTarget);

  useEffect(() => {
    if (isOpen) {
      // If the previously-selected mode was disabled in settings, fall back
      // to the first visible mode so the picker never shows an empty selection.
      const stillVisible = visibleModes.some((m) => m.value === winMode);
      setMode(stillVisible ? winMode : (visibleModes[0]?.value || "high"));
      setTarget(seedTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, winMode, targetScore]);

  // Swish has a locked 500 target — no user-editable end score. High/Low keep
  // their optional target input.
  const hasTarget = mode === "high" || mode === "low";

  const handleDone = () => {
    if (mode === "swish") {
      onSelect("swish", 500);
      onClose();
      return;
    }
    if (mode === "ginrummy") {
      onSelect("ginrummy", 100);
      onClose();
      return;
    }
    if (mode === "hotdice") {
      onSelect("hotdice", 10000);
      onClose();
      return;
    }
    if (mode === "skipbo") {
      onSelect("skipbo", 500);
      onClose();
      return;
    }
    const n = hasTarget && target.trim() !== "" ? parseInt(target, 10) : null;
    onSelect(mode, Number.isFinite(n) && n > 0 ? n : null);
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Select"
      title="Game Mode"
      scrollable
      avoidKeyboard
      footer={
        <Button onClick={handleDone} className="w-full">
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-2.5 pb-1 pr-1">
        {visibleModes.map(({ value, label, emoji }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setMode(value)}
              aria-pressed={active}
              className="w-full h-14 flex items-center gap-3 pl-2 pr-3 border-3 border-ink rounded-xl text-left flex-shrink-0 transition-[background-color,box-shadow] duration-150"
              style={{
                backgroundColor: active ? "#FFD23F" : "rgb(var(--surface))",
                boxShadow: active ? "4px 4px 0 rgb(var(--ink))" : "none",
              }}
            >
              <PlayerTile emoji={emoji} color={active ? "#FFFFFF" : "rgb(var(--paper))"} size={38} radius={9} border={2.5} />
              <span className={`flex-1 text-[17px] font-extrabold ${active ? "text-ink" : ""}`}>{label}</span>
              {active && (
                <span className="w-7 h-7 flex items-center justify-center bg-ink rounded-lg">
                  <Check size={16} strokeWidth={3.5} color="#FFFFFF" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasTarget && (
        <div className="mt-4 pb-2">
          <SectionLabel as="label" htmlFor="target-score" className="text-[11px]">
            End at score (optional)
          </SectionLabel>
          <Input
            id="target-score"
            type="text"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
            onFocus={(e) => {
              // Once the sheet has lifted above the keyboard, keep the field in view.
              const el = e.target;
              setTimeout(() => el.scrollIntoView({ block: "center" }), 200);
            }}
            placeholder="e.g. 500"
            className="mt-1.5 w-[calc(100%-4px)]"
          />
          <p className="text-sm font-medium text-subtle mt-2.5 leading-relaxed">
            First to reach it ends the game{mode === "low" ? " — lowest total wins" : ""}. Leave blank for open-ended.
          </p>
        </div>
      )}
    </BottomSheetModal>
  );
}
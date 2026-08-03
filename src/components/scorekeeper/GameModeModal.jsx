import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import FluentEmoji from "./FluentEmoji";
import { useGameModeToggles } from "@/lib/useGameModeToggles";

// Generic scoring shapes. High/Low take an optional target score that ends the
// game when anyone reaches it — e.g. Gin = High + 100, "Swish" = Low + 500
// (first to 500 ends it, lowest total wins). Best Of asks for a round count next.
// `optional: true` means the mode can be hidden via Settings → Game Modes.
const MODES = [
  { value: "swish", label: "Swish", emoji: "⚡", optional: true },
  { value: "ginrummy", label: "Gin Rummy", emoji: "🎴", optional: true },
  { value: "hotdice", label: "Hot Dice", emoji: "🎲", optional: true },
  { value: "phase10", label: "Phase 10", emoji: "🃏", optional: true },
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
      footer={
        <Button
          onClick={handleDone}
          className="w-full h-11 bg-white hover:bg-white/90 font-semibold"
          style={{ color: "#111111" }}
        >
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-2 pb-1">
        {visibleModes.map(({ value, label, emoji }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setMode(value)}
              className="w-full flex items-center gap-3 px-4 h-14 rounded-full transition-colors text-left border flex-shrink-0"
              style={{
                borderColor: active ? "hsl(199 94% 40% / 0.4)" : "hsl(var(--border))",
                backgroundColor: active ? "hsl(199 94% 40% / 0.12)" : "hsl(var(--secondary))",
              }}
            >
              <FluentEmoji emoji={emoji} size={36} />
              <span className="text-foreground leading-tight [font-family:'Geist',_sans-serif] font-semibold text-base">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Optional target for High/Low */}
      {hasTarget && (
        <div className="mt-4 px-1 pb-2">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            End at score (optional)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 500"
            className="mt-2 w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent-blue transition-colors"
          />
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            First to reach it ends the game{mode === "low" ? " — lowest total wins" : ""}. Leave blank for open-ended.
          </p>
        </div>
      )}
    </BottomSheetModal>
  );
}
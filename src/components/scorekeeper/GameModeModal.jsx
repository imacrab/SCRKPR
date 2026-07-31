import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import FluentEmoji from "./FluentEmoji";

// Generic scoring shapes. High/Low take an optional target score that ends the
// game when anyone reaches it — e.g. Gin = High + 100, "Swish" = Low + 500
// (first to 500 ends it, lowest total wins). Best Of asks for a round count next.
const MODES = [
  { value: "swish", label: "Swish", sub: "First to 500 ends — lowest wins", emoji: "⚡" },
  { value: "low", label: "Low Score", sub: "Lowest total wins", emoji: "📉" },
  { value: "high", label: "High Score", sub: "Highest total wins", emoji: "📈" },
  { value: "bestof", label: "Best Of", sub: "First to win any number of rounds", emoji: "🏆" },
];

export default function GameModeModal({ isOpen, winMode, targetScore, onSelect, onClose }) {
  const [mode, setMode] = useState(winMode || "swish");
  const [target, setTarget] = useState(targetScore ? String(targetScore) : "");

  useEffect(() => {
    if (isOpen) {
      setMode(winMode || "swish");
      setTarget(targetScore ? String(targetScore) : "");
    }
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
        {MODES.map(({ value, label, sub, emoji }) => {
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
              <span className="flex flex-col">
                <span className="text-foreground leading-tight [font-family:'Geist',_sans-serif] font-semibold text-base">{label}</span>
                <span className="text-muted-foreground leading-tight mt-0.5 text-sm">{sub}</span>
              </span>
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
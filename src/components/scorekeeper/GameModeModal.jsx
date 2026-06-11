import BottomSheetModal from "./BottomSheetModal";
import FluentEmoji from "./FluentEmoji";

const MODES = [
  { value: "ginrummy", label: "Gin Rummy", sub: "Please don't go out", emoji: "🎴" },
  { value: "swish", label: "Swish", sub: "Crawl under that worm", emoji: "⚡" },
  { value: "low", label: "Low Score", sub: "Lowest total wins", emoji: "📉" },
  { value: "high", label: "High Score", sub: "Highest total wins", emoji: "📈" },
  { value: "bestof", label: "Best Of", sub: "First to win whatever rounds", emoji: "🏆" },
];

export default function GameModeModal({ isOpen, winMode, onSelect, onClose }) {
  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Select"
      title="Game Mode"
      scrollable
    >
      <div className="flex flex-col gap-2 pb-6">
        {MODES.map(({ value, label, sub, emoji }) => {
          const active = winMode === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
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
    </BottomSheetModal>
  );
}
import { RotateCcw, UserPlus, Sun, Moon } from "lucide-react";
import { usePlayerTone } from "@/lib/usePlayerTone";
import BottomSheetModal from "./BottomSheetModal";

export default function GameMenuModal({ isOpen, canAddPlayer, onAddPlayer, onResetScores, onClose }) {
  const [tone, setTone] = usePlayerTone();
  const items = [
    canAddPlayer && {
      key: "add",
      label: "Add Player",
      icon: UserPlus,
      onClick: onAddPlayer,
    },
    {
      key: "reset",
      label: "Reset Scores",
      icon: RotateCcw,
      onClick: onResetScores,
    },
  ].filter(Boolean);

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Game"
      title="Menu"
    >
      {/* Player background tone — WCAG AA contrast */}
      <div className="mb-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 px-1">
          Player Background
        </p>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary">
          <button
            onClick={() => setTone("dark")}
            className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${tone === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Moon size={16} strokeWidth={2} />
            Dark
          </button>
          <button
            onClick={() => setTone("light")}
            className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${tone === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Sun size={16} strokeWidth={2} />
            Light
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        {items.map(({ key, label, icon: Icon, onClick, muted }) => (
          <button
            key={key}
            onClick={() => { onClick?.(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 h-12 rounded-xl bg-secondary hover:bg-accent transition-colors text-left"
          >
            <Icon size={20} strokeWidth={2} className={muted ? "text-muted-foreground" : "text-foreground"} />
            <span className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheetModal>
  );
}
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
import { WinnerCard, SectionLabel, PageTitle, PAGE_TOP } from "./neo";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import HistoryGameStats from "./HistoryGameStats";
import { TRANSITION_PANEL, SPRING_ENTER } from "@/lib/motion";

const safeFormat = (value, fmt) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};

// Detail view for a single past game. Rendered inside the History page,
// slides in from the right when a game card is tapped. The parent handles
// the enter/exit transition; this component owns its own header + content.
//
// Swipe-back: horizontal drag from the left edge closes the view (native iOS
// feel). Framer's drag handles the gesture; we snap-close past a threshold.
export default function HistoryGameDetail({ game, onBack }) {
  if (!game) return null;

  const isLowWin = isLowMode(game.win_mode);
  const modeMeta = getModeMeta(game.win_mode);
  const sorted = [...game.players].sort((a, b) =>
    isLowWin ? a.total - b.total : b.total - a.total
  );
  const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;

  // ScoreHistoryPanel keys by player.id — stored games use `name` as identity,
  // so synthesize a stable id from the index.
  const roundsPlayers = game.players.map((p, i) => ({
    id: `${i}-${p.name}`,
    name: p.name,
    color: p.color,
    emoji: p.emoji,
    scores: p.scores || [],
  }));

  return (
    <motion.div
      className="absolute inset-0 z-40 bg-background flex flex-col overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={TRANSITION_PANEL}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.6 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 || info.velocity.x > 500) onBack();
      }}
      style={{ paddingTop: PAGE_TOP, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="px-5 h-12 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="neo-press w-11 h-11 flex items-center justify-center bg-surface border-3 border-ink rounded-[11px] shadow-neo-sm flex-shrink-0"
          aria-label="Back to history"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <PageTitle className="text-[26px]">Game details</PageTitle>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING_ENTER, delay: 0.05 }}
        >
          <WinnerCard
            label="Game"
            date={safeFormat(game.played_at, "MMM d · h:mm a")}
            sorted={sorted}
            isTie={isTie}
            modeLabel={modeMeta.label}
          />
        </motion.div>

        <SectionLabel className="mt-[26px] mb-2.5">Stats</SectionLabel>
        <HistoryGameStats game={game} />

        <SectionLabel className="mt-[26px] mb-2.5">Rounds</SectionLabel>
        <ScoreHistoryPanel players={roundsPlayers} winMode={game.win_mode} />
      </div>
    </motion.div>
  );
}
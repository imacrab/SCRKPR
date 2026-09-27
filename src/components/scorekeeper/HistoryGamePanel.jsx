import { motion } from "framer-motion";
import { RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { isLowMode, isCircleMode, getModeMeta } from "@/lib/gameModes";
import { toNeoColor } from "@/lib/colors";
import { SPRING_ENTER } from "@/lib/motion";
import FluentEmoji from "./FluentEmoji";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import HistoryGameStats from "./HistoryGameStats";
import { PlayerTile, SectionLabel, WIDE_PANEL } from "./neo";

const safeFormat = (value, fmt) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};

// Tablet detail pane for Past Rounds — the phone shows the same content as a
// full-screen push (HistoryGameDetail).
export default function HistoryGamePanel({ game, onDelete, onRematch }) {
  const isLowWin = isLowMode(game.win_mode);
  const modeMeta = getModeMeta(game.win_mode);
  const sorted = [...game.players].sort((a, b) => (isLowWin ? a.total - b.total : b.total - a.total));
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
  const tiedNames = sorted.filter((p) => p.total === winner.total).map((p) => p.name).join(" & ");
  const maxTotal = Math.max(1, ...sorted.map((p) => Math.abs(p.total)));
  // Best Of games don't store their round count, so they can't be replayed.
  const canRematch = !isCircleMode(game.win_mode);

  const roundsPlayers = game.players.map((p, i) => ({
    id: `${i}-${p.name}`,
    name: p.name,
    color: p.color,
    emoji: p.emoji,
    scores: p.scores || [],
  }));

  return (
    <motion.section
      key={game.id}
      aria-label="Game details"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPRING_ENTER}
      className={`h-full flex flex-col overflow-hidden ${WIDE_PANEL}`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pt-6 pb-4">
        <div className="font-mono flex justify-between gap-3 text-xs font-bold tracking-[0.12em] uppercase text-subtle">
          <span>Game details</span>
          <span>{safeFormat(game.played_at, "MMM d · h:mm a")}</span>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <PlayerTile emoji={isTie ? "🤝" : winner.emoji || "🏆"} color={isTie ? "rgb(var(--surface))" : toNeoColor(winner.color)} size={84} radius={18} className="shadow-neo" />
            <span className="absolute -right-3 -bottom-2.5 w-9 h-9 flex items-center justify-center bg-sun text-ink border-2.5 border-ink rounded-full">
              <FluentEmoji emoji="🏆" size={20} />
            </span>
          </div>
          <div className="min-w-0">
            <SectionLabel className="!text-fg">{isTie ? "It's a tie" : "Winner"}</SectionLabel>
            <div className="font-display mt-0.5 text-[42px] leading-[1.05] uppercase truncate">{isTie ? tiedNames : winner.name}</div>
            <div className="mt-0.5 text-[17px] font-bold">{winner.total} pts · {modeMeta.label}</div>
          </div>
        </div>

        <SectionLabel className="mt-8 mb-3">Final standings</SectionLabel>
        <div className="flex flex-col gap-3">
          {sorted.map((p, i) => (
            <div key={`${i}-${p.name}`} className="flex items-center gap-4">
              <span className="w-28 flex-shrink-0 truncate text-[17px] font-extrabold">{p.name}</span>
              <div className="flex-1 h-9 bg-paper border-3 border-ink rounded-[10px] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.abs(p.total) / maxTotal) * 100}%` }}
                  transition={{ ...SPRING_ENTER, delay: 0.1 + i * 0.05 }}
                  className="h-full border-r-3 border-ink"
                  style={{ background: toNeoColor(p.color) }}
                />
              </div>
              <span className="font-display w-16 flex-shrink-0 text-right text-2xl">{p.total}</span>
            </div>
          ))}
        </div>

        <SectionLabel className="mt-8 mb-3">Stats</SectionLabel>
        <HistoryGameStats game={game} />

        <SectionLabel className="mt-8 mb-3">Rounds</SectionLabel>
        <ScoreHistoryPanel players={roundsPlayers} winMode={game.win_mode} />
      </div>

      <div className="flex-shrink-0 flex gap-3.5 px-7 pt-4 pb-6 border-t-3 border-ink">
        <Button variant="outline" size="icon" onClick={onDelete} aria-label="Delete game">
          <Trash2 size={22} strokeWidth={2.5} />
        </Button>
        {canRematch && (
          <Button onClick={onRematch} className="font-display flex-1 mr-1 text-xl uppercase">
            <RotateCcw size={22} strokeWidth={2.75} />
            Rematch
          </Button>
        )}
      </div>
    </motion.section>
  );
}

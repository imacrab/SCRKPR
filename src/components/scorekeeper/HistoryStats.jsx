import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { isLowMode } from "@/lib/gameModes";
import FluentEmoji from "./FluentEmoji";
import { TRANSITION_PANEL } from "@/lib/motion";

export default function HistoryStats({ games }) {
  const { totalGames, perPlayer } = useMemo(() => {
    const stats = {};
    games.forEach((game) => {
      const isLowWin = isLowMode(game.win_mode);
      const sorted = [...game.players].sort((a, b) =>
        isLowWin ? a.total - b.total : b.total - a.total
      );
      const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
      const winnerName = isTie ? null : sorted[0]?.name;

      game.players.forEach((p) => {
        if (!stats[p.name]) {
          stats[p.name] = { name: p.name, color: p.color, emoji: p.emoji, games: 0, wins: 0, totalScore: 0 };
        }
        stats[p.name].games += 1;
        stats[p.name].totalScore += p.total ?? 0;
        if (p.emoji) stats[p.name].emoji = p.emoji;
        if (p.name === winnerName) stats[p.name].wins += 1;
      });
    });

    const arr = Object.values(stats)
      .map((s) => ({
        ...s,
        avg: s.games > 0 ? s.totalScore / s.games : 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.games - a.games);

    return { totalGames: games.length, perPlayer: arr };
  }, [games]);

  if (totalGames === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <BarChart3 size={16} strokeWidth={2} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">All-time Stats</span>
        <span className="text-xs text-muted-foreground">
          · {totalGames} game{totalGames !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="px-4 pb-3 pt-1">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-5">Player</div>
          <div className="col-span-2 text-right">Games</div>
          <div className="col-span-2 text-right">Wins</div>
          <div className="col-span-3 text-right">Avg Score</div>
        </div>

        <div className="space-y-1">
          {perPlayer.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...TRANSITION_PANEL, delay: i * 0.05 }}
              className="grid grid-cols-12 gap-2 items-center py-1.5 min-h-[36px]"
            >
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                {p.emoji ? (
                  <span
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: p.color }}
                  >
                    <FluentEmoji emoji={p.emoji} size={16} />
                  </span>
                ) : (
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-[7px]"
                    style={{ backgroundColor: p.color }}
                  />
                )}
                <span className="text-sm text-foreground truncate">{p.name}</span>
                {i === 0 && p.wins > 0 && <FluentEmoji emoji="👑" size={14} />}
              </div>
              <div className="col-span-2 text-right text-sm text-muted-foreground tabular-nums">
                {p.games}
              </div>
              <div
                className="col-span-2 text-right text-sm font-semibold tabular-nums"
                style={{ color: p.color }}
              >
                {p.wins}
              </div>
              <div className="col-span-3 text-right text-sm text-foreground tabular-nums">
                {p.avg.toFixed(1)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

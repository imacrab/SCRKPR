import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart3 } from "lucide-react";
import { isLowMode } from "@/lib/gameModes";
import { TRANSITION_FADE, TRANSITION_PANEL } from "@/lib/motion";

export default function HistoryStats({ games }) {
  const [expanded, setExpanded] = useState(false);

  const { totalGames, perPlayer } = useMemo(() => {
    const stats = {};
    games.forEach((game) => {
      const isLowWin = isLowMode(game.win_mode);
      const sorted = [...game.players].sort((a, b) =>
        isLowWin ? a.total - b.total : b.total - a.total
      );
      const topScore = sorted[0]?.total;
      const isTie = sorted.length > 1 && sorted[0].total === sorted[1].total;
      const winnerName = isTie ? null : sorted[0]?.name;

      game.players.forEach((p) => {
        if (!stats[p.name]) {
          stats[p.name] = { name: p.name, color: p.color, games: 0, wins: 0, totalScore: 0 };
        }
        stats[p.name].games += 1;
        stats[p.name].totalScore += p.total ?? 0;
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
    <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={16} strokeWidth={2} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Stats</span>
          <span className="text-xs text-muted-foreground">
            · {totalGames} game{totalGames !== 1 ? "s" : ""}
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={TRANSITION_FADE}>
          <ChevronDown size={16} strokeWidth={2} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION_PANEL}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-border">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <div className="col-span-5">Player</div>
                <div className="col-span-2 text-right">Games</div>
                <div className="col-span-2 text-right">Wins</div>
                <div className="col-span-3 text-right">Avg Score</div>
              </div>

              <div className="space-y-1">
                {perPlayer.map((p) => (
                  <div
                    key={p.name}
                    className="grid grid-cols-12 gap-2 items-center py-1.5 min-h-[36px]"
                  >
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm text-foreground truncate">{p.name}</span>
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
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

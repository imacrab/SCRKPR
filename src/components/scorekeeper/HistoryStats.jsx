import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { isLowMode } from "@/lib/gameModes";
import NeoIcon from "./NeoIcon";
import { PlayerTile } from "./neo";
import { toNeoColor } from "@/lib/colors";
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
    <div className="mr-1.5 bg-surface border-3 border-ink rounded-2xl shadow-neo-lg overflow-hidden">
      <div className="px-4 h-14 flex items-center gap-2 bg-paper border-b-3 border-ink">
        <BarChart3 size={18} strokeWidth={2.75} />
        <span className="text-base font-extrabold">All-time stats</span>
        <span className="font-mono ml-auto text-[11px] font-bold tracking-[0.08em] uppercase text-subtle">
          {totalGames} game{totalGames !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="font-mono grid grid-cols-12 gap-2 px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-subtle">
        <div className="col-span-5">Player</div>
        <div className="col-span-2 text-right">Games</div>
        <div className="col-span-2 text-right">Wins</div>
        <div className="col-span-3 text-right">Avg</div>
      </div>

      <div className="pb-1">
        {perPlayer.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...TRANSITION_PANEL, delay: i * 0.05 }}
            className={`grid grid-cols-12 gap-2 items-center px-4 h-[52px] ${i < perPlayer.length - 1 ? "border-b-2 border-hairline" : ""}`}
          >
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <PlayerTile icon={p.emoji} color={toNeoColor(p.color)} size={30} radius={8} border={2.5} />
              <span className="text-[15px] font-bold truncate">{p.name}</span>
              {i === 0 && p.wins > 0 && <NeoIcon name="crown" size={16} className="text-sun" />}
            </div>
            <div className="col-span-2 text-right text-base font-bold tabular-nums text-subtle">{p.games}</div>
            <div className="col-span-2 flex justify-end">
              <span className="font-display min-w-[30px] h-7 px-1 flex items-center justify-center text-base border-2 border-ink rounded-md" style={{ background: i === 0 && p.wins > 0 ? "#FFD23F" : "rgb(var(--surface))", color: i === 0 && p.wins > 0 ? "rgb(var(--ink))" : undefined }}>
                {p.wins}
              </span>
            </div>
            <div className="col-span-3 text-right text-base font-bold tabular-nums">{p.avg.toFixed(1)}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

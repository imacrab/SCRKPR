import { useMemo } from "react";
import { motion } from "framer-motion";
import { isLowMode } from "@/lib/gameModes";

// Per-game stats block for the History detail view. Mirrors EndGameModal's
// stats section but reads from a stored GameHistory record — so no live timer,
// no elapsed time (not persisted). Anything derivable from stored scores is
// shown (rounds count, went-out tallies, worst round, worst score).
//
// Rows are the same "muted pill" pattern as EndGameModal for visual continuity.
export default function HistoryGameStats({ game }) {
  const stats = useMemo(() => {
    const players = game?.players || [];
    if (players.length === 0) return null;

    // A "round" here = the count of scores logged per player, averaged. Games
    // where players logged an uneven number of rounds (rare, but possible if
    // someone dropped out) round to the nearest whole.
    const totalRounds = Math.round(
      players.reduce((sum, p) => sum + (p.scores?.length || 0), 0) / players.length
    );

    // Player with the most rounds logged (relevant for best-of / circle modes).
    let mostRoundsPlayer = null;
    let mostRoundsCount = -1;
    players.forEach((p) => {
      const c = p.scores?.length || 0;
      if (c > mostRoundsCount) { mostRoundsCount = c; mostRoundsPlayer = p; }
    });

    // Worst finisher — highest total in low-score modes, lowest otherwise.
    const isLowWin = isLowMode(game.win_mode);
    const worstFinisher = [...players].sort((a, b) =>
      isLowWin ? b.total - a.total : a.total - b.total
    )[0];

    // Swish-only stats — same formulas as EndGameModal:
    //   • Went out most : who scored exactly 0 in the most rounds
    //   • Worst round   : single largest one-round score across the game
    const isSwish = game.win_mode === "swish";
    let wentOutPlayer = null;
    let wentOutCount = 0;
    let worstRoundPlayer = null;
    let worstRoundScore = -Infinity;
    let worstRoundNumber = 0;
    if (isSwish) {
      players.forEach((p) => {
        const zeros = (p.scores || []).filter((s) => s === 0).length;
        if (zeros > wentOutCount) { wentOutCount = zeros; wentOutPlayer = p; }
      });
      players.forEach((p) => {
        (p.scores || []).forEach((s, idx) => {
          if (s > worstRoundScore) {
            worstRoundScore = s;
            worstRoundPlayer = p;
            worstRoundNumber = idx + 1;
          }
        });
      });
    }

    return {
      isSwish,
      totalRounds,
      mostRoundsPlayer,
      worstFinisher,
      wentOutPlayer,
      wentOutCount,
      worstRoundPlayer,
      worstRoundScore,
      worstRoundNumber,
    };
  }, [game]);

  if (!stats) return null;

  const rows = stats.isSwish
    ? [
        stats.wentOutPlayer && {
          label: "Went Out Most",
          value: `${stats.wentOutPlayer.name} (${stats.wentOutCount})`,
        },
        stats.worstRoundPlayer && {
          label: "Worst Round",
          value: `${stats.worstRoundPlayer.name} · R${stats.worstRoundNumber} (${stats.worstRoundScore})`,
        },
        { label: "Total Rounds", value: stats.totalRounds },
      ].filter(Boolean)
    : [
        stats.mostRoundsPlayer && {
          label: "Most Rounds Played",
          value: stats.mostRoundsPlayer.name,
        },
        stats.worstFinisher && {
          label: "Worst Score",
          value: `${stats.worstFinisher.name} (${stats.worstFinisher.total})`,
        },
        { label: "Total Rounds", value: stats.totalRounds },
      ].filter(Boolean);

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30"
        >
          <span className="text-xs text-muted-foreground">{row.label}</span>
          <span className="text-sm font-semibold text-foreground">{row.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { isLowMode } from "@/lib/gameModes";
import FluentEmoji from "./FluentEmoji";
import BottomSheetModal from "./BottomSheetModal";
import { PLAYER_COLORS } from "@/lib/colors";

export default function EndGameModal({ isOpen, players, winMode, gameStartTime, onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen || players.length === 0) return;

    const fire = (originX) => {
      confetti({
        particleCount: 120,
        spread: 80,
        startVelocity: 75,
        origin: { x: originX, y: 1.05 + 40 / window.innerHeight },
        colors: PLAYER_COLORS,
        zIndex: 9999,
      });
    };

    const t1 = setTimeout(() => fire(0.2), 250);
    const t2 = setTimeout(() => fire(0.8), 400);
    const t3 = setTimeout(() => fire(0.5), 600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isOpen, players, winMode]);

  const hasPlayers = isOpen && players.length > 0;

  const isLowWin = isLowMode(winMode);
  const sorted = hasPlayers
    ? [...players]
        .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
        .sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total)
    : [];

  const topScore = sorted[0]?.total ?? 0;
  const tied = sorted.filter((p) => p.total === topScore);
  const isTie = tied.length > 1;
  const winner = sorted[0];

  const totalRounds = hasPlayers
    ? players.reduce((sum, p) => sum + p.scores.length, 0) / players.length
    : 0;
  const roundsWon = {};
  players.forEach((p) => { roundsWon[p.id] = p.scores.length; });
  const roundsWonEntries = Object.entries(roundsWon);
  const playerWithMostRounds = roundsWonEntries.length > 0
    ? roundsWonEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
    : null;
  const mostRoundsPlayer = players.find((p) => p.id == playerWithMostRounds);

  const loserPlayer = sorted[sorted.length - 1];

  const elapsedMs = gameStartTime ? new Date() - gameStartTime : 0;
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <AnimatePresence>
      {hasPlayers && (
        <BottomSheetModal
          isOpen={hasPlayers}
          onClose={onCancel}
          scrollable
          footer={
            <div className="flex gap-3">
              <Button onClick={onCancel} variant="outline" className="flex-1 h-11">
                Keep Playing
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 h-11 font-semibold bg-green-600 hover:bg-green-700 text-white"
                style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              >
                End Game
              </Button>
            </div>
          }
        >
          {/* Winner / Tie */}
          <div className="flex flex-col items-center text-center mb-6 pt-2">
            <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-muted">
              <FluentEmoji emoji={isTie ? "🤝" : "🏆"} size={32} />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
              {isTie ? "It's a Tie!" : "Winner"}
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {isTie ? tied.map((p) => p.name).join(" & ") : winner?.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{winner?.total ?? 0} pts · {isLowWin ? "lowest score" : "highest score"} wins</p>
          </div>

          {/* Standings */}
          <div className="space-y-1 mb-6">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: `${p.color}12` }}>
                <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                <span className="text-sm font-semibold text-white">{p.total}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">Most Rounds Played</span>
              <span className="text-sm font-semibold text-foreground">{mostRoundsPlayer?.name}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">Worst Score</span>
              <span className="text-sm font-semibold text-foreground">{loserPlayer?.name} ({loserPlayer?.total})</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">Total Rounds</span>
              <span className="text-sm font-semibold text-foreground">{Math.round(totalRounds)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">Time Elapsed</span>
              <span className="text-sm font-semibold text-foreground">{minutes}m {seconds}s</span>
            </div>
          </div>
        </BottomSheetModal>
      )}
    </AnimatePresence>
  );
}
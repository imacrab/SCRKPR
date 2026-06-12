import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { isLowMode } from "@/lib/gameModes";
import FluentEmoji from "./FluentEmoji";
import BottomSheetModal from "./BottomSheetModal";
import { PLAYER_COLORS } from "@/lib/colors";
import { SPRING_SHEET } from "@/lib/motion";

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

    // Finale: rain the winner's own emoji 🎉 (skipped on ties or if unsupported)
    const lowWin = isLowMode(winMode);
    const ranked = [...players]
      .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
      .sort((a, b) => (lowWin ? a.total - b.total : b.total - a.total));
    const isTied = ranked.length > 1 && ranked[0].total === ranked[1].total;
    const winnerEmoji = !isTied ? ranked[0]?.emoji : null;

    let t4 = null;
    if (winnerEmoji && typeof confetti.shapeFromText === "function") {
      const emojiShape = confetti.shapeFromText({ text: winnerEmoji, scalar: 3 });
      t4 = setTimeout(() => {
        confetti({
          particleCount: 18,
          spread: 110,
          startVelocity: 55,
          gravity: 0.8,
          scalar: 3,
          shapes: [emojiShape],
          origin: { x: 0.5, y: 1.05 + 40 / window.innerHeight },
          zIndex: 9999,
        });
      }, 850);
    }

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); if (t4) clearTimeout(t4); };
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
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.25 }}
              className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-muted"
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }}
                className="flex"
              >
                <FluentEmoji emoji={isTie ? "🤝" : "🏆"} size={32} />
              </motion.span>
            </motion.div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
              {isTie ? "It's a Tie!" : "Winner"}
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {isTie ? tied.map((p) => p.name).join(" & ") : winner?.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{winner?.total ?? 0} pts · {isLowWin ? "lowest score" : "highest score"} wins</p>
          </div>

          {/* Standings — staggered entrance, medals for the podium */}
          <div className="space-y-1 mb-6">
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING_SHEET, delay: 0.35 + i * 0.07 }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ backgroundColor: `${p.color}12` }}
              >
                <span className="text-xs text-muted-foreground w-5 text-right">
                  {!isTie && i === 0 ? <FluentEmoji emoji="🥇" size={16} />
                    : !isTie && i === 1 ? <FluentEmoji emoji="🥈" size={16} />
                    : !isTie && i === 2 ? <FluentEmoji emoji="🥉" size={16} />
                    : i + 1}
                </span>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                <span className="text-sm font-semibold text-white">{p.total}</span>
              </motion.div>
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
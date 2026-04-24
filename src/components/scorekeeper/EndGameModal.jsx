import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function EndGameModal({ isOpen, players, winMode, gameStartTime, onConfirm, onCancel }) {
  if (!isOpen || players.length === 0) return null;

  const isLowWin = winMode === "low";
  const sorted = [...players]
    .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
    .sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);

  const topScore = sorted[0].total;
  const tied = sorted.filter((p) => p.total === topScore);
  const isTie = tied.length > 1;
  const winner = sorted[0];

  // Calculate stats
  const totalRounds = players.reduce((sum, p) => sum + p.scores.length, 0) / players.length;
  const roundsWon = {};
  players.forEach((p) => {
    roundsWon[p.id] = p.scores.length;
  });
  const playerWithMostRounds = Object.entries(roundsWon).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const mostRoundsPlayer = players.find((p) => p.id == playerWithMostRounds);
  
  const loserPlayer = isLowWin 
    ? sorted[sorted.length - 1]
    : sorted[sorted.length - 1];
  
  const elapsedMs = gameStartTime ? new Date() - gameStartTime : 0;
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onCancel}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-5 pt-5 pb-6">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {/* Winner / Tie */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl font-bold bg-muted">
                  {isTie ? "🤝" : "🏆"}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                  {isTie ? "It's a Tie!" : "Winner"}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {isTie ? tied.map((p) => p.name).join(" & ") : winner.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{winner.total} pts · {isLowWin ? "lowest score" : "highest score"} wins</p>
              </div>

              {/* Standings */}
              <div className="space-y-1 mb-6">
                {sorted.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: i === 0 ? `${p.color}12` : undefined }}>
                    <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                    <span className="text-sm font-semibold" style={{ color: p.color }}>{p.total}</span>
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
                  <span className="text-xs text-muted-foreground">{isLowWin ? "Worst Score" : "Worst Score"}</span>
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

              <div className="flex gap-3">
                <Button onClick={onCancel} variant="outline" className="flex-1 h-11">
                  Keep Playing
                </Button>
                <Button
                  onClick={onConfirm}
                  className="flex-1 h-11 font-semibold bg-white hover:bg-white/90"
                  style={{ color: "#111" }}
                >
                  End Game
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
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
  const modeMeta = getModeMeta(winMode);

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
          {/* Winner hero — mirrors the History "Latest Game" card: winner-color
              gradient, hairline border, oversized ghosted winner emoji, big
              avatar, display name + pts·mode. */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_SHEET, delay: 0.1 }}
            className="mb-5 rounded-3xl overflow-hidden relative"
            style={{
              background: isTie
                ? "hsl(var(--muted) / 0.4)"
                : `linear-gradient(155deg, ${winner?.color}3a 0%, ${winner?.color}14 38%, hsl(var(--card)) 72%)`,
            }}
          >
            {/* Oversized winner emoji bleeding off the corner */}
            {!isTie && winner?.emoji && (
              <div
                className="absolute pointer-events-none select-none"
                style={{ right: -18, top: -14, transform: "rotate(16deg)", opacity: 0.22 }}
                aria-hidden="true"
              >
                <FluentEmoji emoji={winner.emoji} size={130} />
              </div>
            )}

            <div className="px-5 py-4 flex items-center gap-3 relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.25 }}
                className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-white/25 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: isTie ? "hsl(var(--muted))" : winner?.color }}
              >
                <motion.span
                  animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }}
                  className="flex"
                >
                  {isTie
                    ? <FluentEmoji emoji="🤝" size={30} />
                    : winner?.emoji
                      ? <FluentEmoji emoji={winner.emoji} size={34} />
                      : <FluentEmoji emoji="🏆" size={30} />}
                </motion.span>
              </motion.div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5 flex items-center gap-1">
                  {!isTie && <FluentEmoji emoji="🏆" size={12} />}
                  {isTie ? "It's a Tie" : "Winner"}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground leading-tight truncate">
                  {isTie ? tied.map((p) => p.name).join(" & ") : winner?.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  {winner?.total ?? 0} pts
                  <span>·</span>
                  <FluentEmoji emoji={modeMeta.emoji} size={12} />
                  {modeMeta.label}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Standings — same emoji chips + medals as the History podium, but
              NOT inside the winner-color border. A long bordered card became a
              tall scroll region whose side borders ran past the sheet's top edge
              (no sticky header to mask them). Borderless, it scrolls cleanly. */}
          <div className="space-y-1 mb-6">
              {sorted.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SHEET, delay: 0.35 + i * 0.07 }}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl"
                  style={{ backgroundColor: `${p.color}14` }}
                >
                  <span className="text-xs text-muted-foreground w-5 text-right">
                    {!isTie && i === 0 ? <FluentEmoji emoji="🥇" size={16} />
                      : !isTie && i === 1 ? <FluentEmoji emoji="🥈" size={16} />
                      : !isTie && i === 2 ? <FluentEmoji emoji="🥉" size={16} />
                      : i + 1}
                  </span>
                  {p.emoji
                    ? <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: p.color }}><FluentEmoji emoji={p.emoji} size={16} /></span>
                    : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-[7px]" style={{ backgroundColor: p.color }} />}
                  <span className="text-sm text-foreground flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-sm font-bold" style={{ color: p.color }}>{p.total}</span>
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
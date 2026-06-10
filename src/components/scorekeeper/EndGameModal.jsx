import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLowMode } from "@/lib/gameModes";

export default function EndGameModal({ isOpen, players, winMode, gameStartTime, onConfirm, onCancel }) {
  const contentRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!isOpen || players.length === 0) return;

    const rainbowColors = [
      "#FF3A3A", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
      "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
      "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
    ];

    const fire = (originX) => {
      confetti({
        particleCount: 120,
        spread: 80,
        startVelocity: 75,
        origin: { x: originX, y: 1.05 + 40 / window.innerHeight },
        colors: rainbowColors,
        zIndex: 9999,
      });
    };

    const t1 = setTimeout(() => fire(0.2), 250);
    const t2 = setTimeout(() => fire(0.8), 400);
    const t3 = setTimeout(() => fire(0.5), 600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isOpen, players, winMode]);

  // Detect whether content would overflow the viewport — if so, switch to full-screen layout
  useLayoutEffect(() => {
    if (!isOpen) { setIsFullScreen(false); return; }
    const check = () => {
      const el = contentRef.current;
      if (!el) return;
      // Available height for the bottom-sheet (with 8px gap top/bottom)
      const available = window.innerHeight - 16;
      setIsFullScreen(el.scrollHeight > available);
    };
    const raf = requestAnimationFrame(check);
    window.addEventListener("resize", check);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", check); };
  }, [isOpen, players]);

  if (!isOpen || players.length === 0) return null;

  const isLowWin = isLowMode(winMode);
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

  const loserPlayer = sorted[sorted.length - 1];

  const elapsedMs = gameStartTime ? new Date() - gameStartTime : 0;
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onCancel();
    }
  };

  const Body = (
    <>
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
    </>
  );

  const Actions = (
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
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onCancel}
          />

          {isFullScreen ? (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragSnapToOrigin
              onDragEnd={handleDragEnd}
              className="fixed inset-0 z-50 bg-card flex flex-col"
            >
              {/* Sticky header — drag handle */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex-shrink-0 flex items-center justify-between px-5 border-b border-border touch-none select-none cursor-grab active:cursor-grabbing"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: "12px" }}
              >
                <button
                  onClick={onCancel}
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Close"
                >
                  <X size={22} strokeWidth={2} />
                </button>
                <div className="text-center pointer-events-none">
                  <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    Game Over
                  </p>
                  <h2 className="font-display text-lg font-bold text-foreground leading-tight">
                    {isTie ? "It's a Tie!" : `${winner.name} Wins`}
                  </h2>
                </div>
                <div className="w-10" />
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pt-5">
                {Body}
              </div>

              {/* Sticky footer */}
              <div
                className="flex-shrink-0 px-5 pt-3 border-t border-border bg-card"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
              >
                {Actions}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragSnapToOrigin
              onDragEnd={handleDragEnd}
              className="fixed inset-x-0 z-50 bg-card border border-border rounded-[44px] shadow-2xl"
              style={{ bottom: "8px", left: "8px", right: "8px", paddingBottom: 0 }}
            >
              <div ref={contentRef} className="px-5 pt-5 pb-6">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                {Body}
                {Actions}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
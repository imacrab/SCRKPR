import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function EndGameModal({ isOpen, players, winMode, onConfirm, onCancel }) {
  if (!isOpen || players.length === 0) return null;

  const isLowWin = winMode === "low";
  const sorted = [...players]
    .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
    .sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total);

  const winner = sorted[0];

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

              {/* Winner */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: `${winner.color}22`, color: winner.color }}
                >
                  🏆
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Winner</p>
                <h2 className="font-display text-2xl font-bold text-foreground">{winner.name}</h2>
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
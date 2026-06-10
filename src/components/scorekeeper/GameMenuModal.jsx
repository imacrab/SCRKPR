import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, UserPlus, FlagOff } from "lucide-react";

export default function GameMenuModal({ isOpen, canAddPlayer, onAddPlayer, onResetScores, onEndGame, onClose }) {
  const items = [
    canAddPlayer && {
      key: "add",
      label: "Add Player",
      icon: UserPlus,
      onClick: onAddPlayer,
    },
    {
      key: "reset",
      label: "Reset Scores",
      icon: RotateCcw,
      onClick: onResetScores,
    },
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-0 z-50 bg-card border border-border rounded-[44px] shadow-2xl"
            style={{ bottom: "8px", left: "8px", right: "8px", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Game</p>
                <h2 className="font-display text-xl font-bold text-foreground">Menu</h2>
              </div>

              <div className="flex flex-col gap-2 mb-3">
                {items.map(({ key, label, icon: Icon, onClick, muted }) => (
                  <button
                    key={key}
                    onClick={() => { onClick?.(); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 h-12 rounded-xl bg-secondary hover:bg-accent transition-colors text-left"
                  >
                    <Icon size={20} strokeWidth={2} className={muted ? "text-muted-foreground" : "text-foreground"} />
                    <span className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
                      {label}
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => { onEndGame?.(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-left mt-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FlagOff size={20} strokeWidth={2} />
                  <span className="text-sm font-semibold">End Game</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
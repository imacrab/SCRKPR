import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";

const MODES = [
  { value: "low",    label: "Low Score",  Icon: TrendingDown },
  { value: "high",   label: "High Score", Icon: TrendingUp },
  { value: "bestof", label: "Best Of",    Icon: Trophy },
];

export default function GameModeModal({ isOpen, winMode, onSelect, onClose }) {
  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Select</p>
                <h2 className="font-display text-xl font-bold text-foreground">Game Mode</h2>
              </div>

              <div className="flex flex-col gap-2">
                {MODES.map(({ value, label, Icon }) => {
                  const active = winMode === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleSelect(value)}
                      className="w-full flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-left border"
                      style={{
                        borderColor: active ? "hsl(199 94% 40% / 0.4)" : "hsl(var(--border))",
                        backgroundColor: active ? "hsl(199 94% 40% / 0.12)" : "hsl(var(--secondary))",
                      }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={2}
                        style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--foreground))" }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
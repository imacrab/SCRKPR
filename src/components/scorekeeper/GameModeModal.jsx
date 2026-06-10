import { motion, AnimatePresence } from "framer-motion";
import FluentEmoji from "./FluentEmoji";

const MODES = [
{ value: "ginrummy", label: "Gin Rummy", sub: "Please don't go out", emoji: "🎴" },
{ value: "swish", label: "Swish", sub: "Crawl under that worm", emoji: "⚡" },
{ value: "low", label: "Low Score", sub: "Lowest total wins", emoji: "📉" },
{ value: "high", label: "High Score", sub: "Highest total wins", emoji: "📈" },
{ value: "bestof", label: "Best Of", sub: "First to win whatever rounds", emoji: "🏆" }];


export default function GameModeModal({ isOpen, winMode, onSelect, onClose }) {
  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40"
          onClick={onClose} />
        
          <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed inset-x-0 z-50 bg-card border border-border rounded-[44px] shadow-2xl"
          style={{ bottom: "8px", left: "8px", right: "8px", paddingBottom: "env(safe-area-inset-bottom)" }}>
          
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Select</p>
                <h2 className="font-display text-xl font-bold text-foreground">Game Mode</h2>
              </div>

              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {MODES.map(({ value, label, sub, emoji }) => {
                const active = winMode === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleSelect(value)}
                    className="w-full flex items-center gap-3 px-4 h-14 rounded-xl transition-colors text-left border flex-shrink-0"
                    style={{
                      borderColor: active ? "hsl(199 94% 40% / 0.4)" : "hsl(var(--border))",
                      backgroundColor: active ? "hsl(199 94% 40% / 0.12)" : "hsl(var(--secondary))"
                    }}>
                    
                      <FluentEmoji emoji={emoji} size={36} />
                      <span className="flex flex-col">
                        <span className="text-foreground leading-tight [font-family:'Geist',_sans-serif] font-semibold text-base">{label}</span>
                        <span className="text-muted-foreground leading-tight mt-0.5 text-sm">{sub}</span>
                      </span>
                    </button>);

              })}
              </div>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}
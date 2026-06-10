import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomTargetModal({ isOpen, onConfirm, onClose }) {
  const [target, setTarget] = useState(100);
  const [direction, setDirection] = useState("high"); // "high" | "low"

  useEffect(() => {
    if (isOpen) {
      setTarget(100);
      setDirection("high");
    }
  }, [isOpen]);

  const adjust = (delta) => setTarget((t) => Math.max(1, Math.min(9999, t + delta)));

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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Custom</p>
                <h2 className="font-display text-xl font-bold text-foreground">Target Score</h2>
              </div>

              {/* Direction toggle */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => setDirection("high")}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl border transition-colors"
                  style={{
                    borderColor: direction === "high" ? "hsl(199 94% 40% / 0.4)" : "hsl(var(--border))",
                    backgroundColor: direction === "high" ? "hsl(199 94% 40% / 0.12)" : "hsl(var(--secondary))",
                  }}
                >
                  <TrendingUp size={18} strokeWidth={2} />
                  <span className="text-sm font-medium">First to reach</span>
                </button>
                <button
                  onClick={() => setDirection("low")}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl border transition-colors"
                  style={{
                    borderColor: direction === "low" ? "hsl(199 94% 40% / 0.4)" : "hsl(var(--border))",
                    backgroundColor: direction === "low" ? "hsl(199 94% 40% / 0.12)" : "hsl(var(--secondary))",
                  }}
                >
                  <TrendingDown size={18} strokeWidth={2} />
                  <span className="text-sm font-medium">Avoid reaching</span>
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-between gap-3 mb-6 px-2">
                <button
                  onClick={() => adjust(-10)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary hover:bg-accent transition-colors"
                  aria-label="Decrease by 10"
                >
                  <Minus size={20} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col items-center flex-1">
                  <span className="font-display text-5xl font-bold text-foreground">{target}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">points</span>
                </div>
                <button
                  onClick={() => adjust(10)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary hover:bg-accent transition-colors"
                  aria-label="Increase by 10"
                >
                  <Plus size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Quick presets */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[50, 100, 250, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTarget(v)}
                    className="h-10 rounded-lg border border-border bg-secondary text-sm font-medium hover:bg-accent transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  Cancel
                </Button>
                <Button
                  onClick={() => onConfirm(direction, target)}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111" }}
                >
                  Start Game
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
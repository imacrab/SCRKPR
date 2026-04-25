import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

const ODD_OPTIONS = [3, 5, 7, 9, 11, 13, 15];

export default function BestOfModal({ isOpen, onConfirm, onClose }) {
  const [bestOf, setBestOf] = useState(7);

  const winsNeeded = Math.ceil(bestOf / 2);

  const decrement = () => {
    const idx = ODD_OPTIONS.indexOf(bestOf);
    if (idx > 0) setBestOf(ODD_OPTIONS[idx - 1]);
  };

  const increment = () => {
    const idx = ODD_OPTIONS.indexOf(bestOf);
    if (idx < ODD_OPTIONS.length - 1) setBestOf(ODD_OPTIONS[idx + 1]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-0 z-50 bg-card border border-border rounded-[20px] shadow-2xl"
            style={{ bottom: "8px", left: "8px", right: "8px" }}
          >
            <div className="px-5 pt-5 pb-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Best Of</p>
                <h2 className="font-display text-xl font-bold text-foreground">How many games?</h2>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center gap-6 mb-3">
                <button
                  onClick={decrement}
                  disabled={bestOf === ODD_OPTIONS[0]}
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 transition-opacity"
                >
                  <Minus size={20} />
                </button>

                <div className="text-center min-w-[80px]">
                  <span className="text-5xl font-bold font-display" style={{ color: "hsl(var(--foreground))" }}>
                    {bestOf}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">total games</p>
                </div>

                <button
                  onClick={increment}
                  disabled={bestOf === ODD_OPTIONS[ODD_OPTIONS.length - 1]}
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 transition-opacity"
                >
                  <Plus size={20} />
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                First to <span className="font-semibold text-foreground">{winsNeeded}</span> wins takes it all
              </p>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  Cancel
                </Button>
                <Button
                  onClick={() => onConfirm(bestOf)}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
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
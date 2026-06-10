import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ResetConfirmModal({ isOpen, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40"
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

              <div className="text-center mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                  Confirm
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">Reset all scores?</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  This will clear every player's score for the current game. Players remain.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  Cancel
                </Button>
                <Button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 h-11 bg-accent-red hover:bg-accent-red/90 text-white font-semibold"
                >
                  Reset
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
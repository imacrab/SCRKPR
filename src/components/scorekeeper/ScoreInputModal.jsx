import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import NumberPad from "./NumberPad";
import { Button } from "@/components/ui/button";

export default function ScoreInputModal({ player, editingIndex, isOpen, onSubmit, onClose }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) setValue("");
  }, [isOpen, player?.id, editingIndex]);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onSubmit(num);
    setValue("");
  };

  const isEditing = editingIndex !== null && editingIndex !== undefined;
  const isValid = value !== "" && value !== "-" && !isNaN(parseFloat(value));

  return (
    <AnimatePresence>
      {isOpen && player && (
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
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
          >
            <div className="px-5 pt-5 pb-8">
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {/* Player / mode label */}
              <div className="text-center mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                  {isEditing ? "Edit Score" : "Add Score"}
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">{player.name}</h2>
              </div>

              {/* Display */}
              <div className="text-center mb-4">
                <span className={`text-5xl font-bold font-display ${
                  value === "" ? "text-muted-foreground/30" :
                  parseFloat(value) < 0 ? "text-accent-red" : "text-accent-blue"
                }`}>
                  {value === "" ? "0" : value}
                </span>
                <div className="mt-3 h-px bg-border mx-6" />
              </div>

              {/* Number pad */}
              <NumberPad value={value} onChange={setValue} />

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  <X size={15} className="mr-1.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-[2] h-11 bg-accent-blue hover:bg-accent-blue/90 text-background font-semibold"
                >
                  <Check size={15} className="mr-1.5" />
                  {isEditing ? "Update" : "Add Score"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
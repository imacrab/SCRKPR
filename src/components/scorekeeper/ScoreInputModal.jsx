import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import NumberPad from "./NumberPad";
import { Button } from "@/components/ui/button";

export default function ScoreInputModal({ player, editingIndex, isOpen, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const prevValue = useRef("");
  const [digitKey, setDigitKey] = useState(0);

  const handleChange = (newVal) => {
    if (newVal !== prevValue.current) {
      prevValue.current = newVal;
      setDigitKey((k) => k + 1);
    }
    setValue(newVal);
  };

  useEffect(() => {
    if (isOpen) {
      setValue("");
      prevValue.current = "";
      setDigitKey(0);
    }
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
            exit={{ y: "110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed inset-x-0 z-50 border border-border rounded-[44px] shadow-2xl"
            style={{ backgroundColor: "hsl(var(--card) / 0.8)", backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)", bottom: "calc(56px + 8px)", left: "8px", right: "8px", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-5 pt-5 pb-8">
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {/* Player / mode label */}
              <div className="text-center mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                  {isEditing ? "Edit Score" : "Add Score"}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground">{player.name}</h2>
              </div>

              {/* Display */}
              <div className="text-center mb-4">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={digitKey}
                    initial={{ opacity: 0, y: -14, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    className="text-5xl font-bold inline-block"
                    style={{ color: value === "" ? "rgba(150,150,150,0.3)" : player.color }}
                  >
                    {value === "" ? "0" : value}
                  </motion.span>
                </AnimatePresence>
                <div className="mt-3 h-px bg-border mx-6" />
              </div>

              {/* Number pad */}
              <NumberPad value={value} onChange={handleChange} />

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  <X size={24} className="mr-1.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold" style={{ color: "#111" }}
                >
                  <Check size={24} className="mr-1.5" />
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
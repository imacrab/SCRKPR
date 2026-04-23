import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

export default function ScoreInputModal({ player, editingIndex, isOpen, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, player?.id, editingIndex]);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onSubmit(num);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  const isEditing = editingIndex !== null && editingIndex !== undefined;

  return (
    <AnimatePresence>
      {isOpen && player && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed inset-x-6 bottom-20 z-50 rounded-3xl overflow-hidden shadow-2xl shadow-black/20"
            style={{ background: "linear-gradient(145deg, hsl(30,35%,99%), hsl(28,25%,95%))" }}
          >
            {/* Inner content */}
            <div className="px-6 pt-7 pb-6">
              {/* Player name */}
              <div className="text-center mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {isEditing ? "Edit Score" : "Add Score"}
                </p>
                <h2 className="font-display text-3xl font-bold text-gradient">{player.name}</h2>
              </div>

              {/* Input */}
              <div className="relative mb-5">
                <input
                  ref={inputRef}
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0"
                  className="w-full text-center text-5xl font-bold font-display bg-transparent outline-none text-foreground placeholder:text-border py-2"
                  inputMode="decimal"
                />
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border border-border bg-white/60 text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={value === "" || isNaN(parseFloat(value))}
                  className="flex-2 flex-[2] h-12 rounded-2xl gradient-warm text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <Check size={16} />
                  {isEditing ? "Update" : "Add Score"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
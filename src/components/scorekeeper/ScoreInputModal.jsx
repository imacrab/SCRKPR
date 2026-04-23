import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import NumberPad from "./NumberPad";

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed inset-x-4 bottom-6 z-50 rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
            style={{ background: "#212125", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-5 pt-6 pb-5">
              {/* Player name */}
              <div className="text-center mb-4">
                <p className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-widest mb-0.5">
                  {isEditing ? "Edit Score" : "Add Score"}
                </p>
                <h2 className="font-display text-2xl font-bold text-gradient">{player.name}</h2>
              </div>

              {/* Display */}
              <div className="relative mb-4 text-center">
                <span className="text-5xl font-bold font-display text-white">
                  {value === "" ? <span className="text-[#3a3a3e]">0</span> : value}
                </span>
                <div className="mt-2 h-px mx-8" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Number pad */}
              <NumberPad value={value} onChange={setValue} />

              {/* Action buttons */}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl text-[#c8c8c8] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-[2] h-12 rounded-2xl gradient-warm text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-30 active:scale-95 transition-transform"
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
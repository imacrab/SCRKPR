import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

export default function AddPlayerModal({ isOpen, onAdd, onClose }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed inset-x-6 bottom-16 z-50 rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
            style={{ background: "#212125", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-6 pt-7 pb-6">
              <div className="text-center mb-5">
                <p className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-widest mb-1">New Player</p>
                <h2 className="font-display text-2xl font-bold text-gradient">Add to Game</h2>
              </div>

              <div className="relative mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  onKeyDown={handleKeyDown}
                  placeholder="Player name"
                  maxLength={20}
                  className="w-full text-center text-2xl font-bold font-display bg-transparent outline-none text-white placeholder:text-[#3a3a3e] py-2"
                  aria-label="New player name"
                />
                <div className="absolute bottom-0 left-4 right-4 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              <div className="flex gap-3">
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
                  disabled={!name.trim()}
                  className="flex-[2] h-12 rounded-2xl gradient-warm text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-30 active:scale-95 transition-transform"
                >
                  <Check size={16} />
                  Add Player
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
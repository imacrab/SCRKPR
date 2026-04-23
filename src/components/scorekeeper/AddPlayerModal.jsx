import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
          >
            <div className="px-5 pt-5 pb-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">New Player</p>
                <h2 className="font-display text-xl font-bold text-foreground">Add to Game</h2>
              </div>

              <Input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
                placeholder="Player name"
                maxLength={20}
                className="mb-5 text-center text-base bg-secondary border-border"
                aria-label="New player name"
              />

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  <X size={24} className="mr-1.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold" style={{ color: "#111" }}
                >
                  <Check size={24} className="mr-1.5" />
                  Add Player
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
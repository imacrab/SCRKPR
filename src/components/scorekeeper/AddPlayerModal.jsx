import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PLAYER_COLORS = [
  "#2DC5F8", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#FF3A3A", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#64748B", "#A78BFA", "#FB7185", "#34D399",
];

export default function AddPlayerModal({ isOpen, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PLAYER_COLORS[0]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setColor(PLAYER_COLORS[0]);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName("");
    setColor(PLAYER_COLORS[0]);
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

              <div className="mb-5">
                <div className="flex flex-wrap gap-2 justify-center">
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c}
                      onPointerDown={(e) => { e.preventDefault(); setColor(c); }}
                      className="w-7 h-7 rounded-full transition-transform active:scale-90"
                      style={{ backgroundColor: c, outline: color === c ? "2px solid white" : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold" style={{ color: "#111" }}
                >
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
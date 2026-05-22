import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAYER_COLORS } from "./PlayerSetup";

export default function EditPlayerModal({ player, isOpen, onSave, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && player) {
      setName(player.name);
      setColor(player.color);
      setTimeout(() => { inputRef.current?.select(); }, 120);
    }
  }, [isOpen, player]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color });
  };

  return (
    <AnimatePresence>
      {isOpen && player && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            style={{ bottom: "calc(56px + 8px)", left: "8px", right: "8px" }}
          >
            <div className="px-5 pt-5 pb-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Edit Player</p>
                <h2 className="font-sans font-medium text-xl text-foreground">Name &amp; Color</h2>
              </div>

              {/* Name input with color dot */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white/20"
                  style={{ backgroundColor: color }}
                />
                <Input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
                  placeholder="Player name"
                  maxLength={20}
                  className="flex-1 text-base bg-secondary border-border"
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {PLAYER_COLORS.map((c) => (
                  <button
                    key={c}
                    onPointerDown={(e) => { e.preventDefault(); setColor(c); }}
                    className="w-8 h-8 rounded-full transition-transform active:scale-90"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? "2.5px solid white" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  <X size={24} strokeWidth={2} className="mr-1.5" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111" }}
                >
                  <Check size={24} strokeWidth={2} className="mr-1.5" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
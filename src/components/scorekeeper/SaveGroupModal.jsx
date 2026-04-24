import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SaveGroupModal({ isOpen, onSave, onClose }) {
  const [name, setName] = useState("");
  const [pinned, setPinned] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, pinned);
    setName("");
    setPinned(false);
  };

  const handleClose = () => {
    setName("");
    setPinned(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 z-50 bg-card border border-border rounded-[20px] shadow-2xl"
            style={{ bottom: "8px)", left: "8px", right: "8px" }}
          >
            <div className="px-5 pt-5 pb-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Save Group</p>
                <h2 className="font-sans font-medium text-xl text-foreground">Name this group</h2>
              </div>
              <div className="flex gap-3 mb-5">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleClose(); }}
                  placeholder="e.g. Friday Night Crew"
                  className="flex-1 text-center text-base bg-secondary border-border h-11"
                />
                <button
                  onClick={() => setPinned((p) => !p)}
                  className="flex items-center justify-center w-11 h-11 rounded-lg border transition-colors"
                  style={{
                    borderColor: pinned ? "rgba(255,255,255,0.35)" : "hsl(var(--border))",
                    backgroundColor: pinned ? "hsl(var(--card))" : "transparent",
                  }}
                >
                  {pinned ? <Pin size={20} /> : <PinOff size={20} />}
                </button>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleClose} variant="outline" className="flex-1 h-11">
                    Cancel
                  </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111" }}
                >
                  Save Group
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
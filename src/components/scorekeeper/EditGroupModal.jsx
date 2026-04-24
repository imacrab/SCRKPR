import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditGroupModal({ isOpen, group, onSave, onClose }) {
  const [name, setName] = useState("");
  const [pinned, setPinned] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && group) {
      setName(group.name);
      setPinned(group.pinned);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, group]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, pinned);
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
            className="fixed inset-x-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
            style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
          >
            <div className="px-5 pt-5 pb-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <div className="text-center mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Edit Group</p>
                <h2 className="font-display text-xl font-bold text-foreground">Group Name</h2>
              </div>

              <div className="flex gap-3 mb-5">
                <Input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
                  placeholder="Group name"
                  maxLength={30}
                  className="flex-1 text-center text-base bg-secondary border-border h-11"
                  aria-label="Group name"
                />
                <button
                  onClick={() => setPinned(!pinned)}
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
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111" }}
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SaveGroupModal({ isOpen, onSave, onClose }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Save Group</p>
                <h2 className="font-sans font-medium text-xl text-foreground">Name this group</h2>
              </div>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
                placeholder="e.g. Friday Night Crew"
                className="mb-5 text-center text-base bg-secondary border-border"
              />
              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-11">
                  <X size={15} className="mr-1.5" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex-[2] h-11 bg-white hover:bg-white/90 font-semibold"
                  style={{ color: "#111" }}
                >
                  <Check size={15} className="mr-1.5" /> Save Group
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
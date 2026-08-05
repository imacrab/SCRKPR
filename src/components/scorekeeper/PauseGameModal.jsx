import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

// Naming sheet for "Pause for later". Pre-fills a sensible default name so
// Save always works; the user can overwrite it. Uses avoidKeyboard so the
// input stays visible above the software keyboard.
export default function PauseGameModal({ isOpen, defaultName, onSave, onClose }) {
  const [name, setName] = useState(defaultName || "");

  useEffect(() => {
    if (isOpen) setName(defaultName || "");
  }, [isOpen, defaultName]);

  const handleSave = () => {
    onSave(name.trim() || defaultName || "Saved game");
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Pause"
      title="Save for later"
      avoidKeyboard
      footer={
        <Button
          onClick={handleSave}
          className="w-full h-11 bg-white hover:bg-white/90 font-semibold"
          style={{ color: "#262729" }}
        >
          Save game
        </Button>
      }
    >
      <div className="px-1 pb-2">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Game name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => {
            // Once the sheet has lifted above the keyboard, keep the field in view.
            const el = e.target;
            setTimeout(() => el.scrollIntoView({ block: "center" }), 200);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          placeholder="e.g. Friday Night Skip-Bo"
          maxLength={60}
          className="mt-2 w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent-blue transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Pick up right where you left off from History → Saved.
        </p>
      </div>
    </BottomSheetModal>
  );
}

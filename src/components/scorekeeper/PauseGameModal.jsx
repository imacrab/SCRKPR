import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomSheetModal from "./BottomSheetModal";
import { PlayerTile, SectionLabel } from "./neo";

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
      leading={<PlayerTile color="#1FBFFF" size={46} radius={11}><Bookmark size={22} strokeWidth={2.5} /></PlayerTile>}
      eyebrow="Pause"
      title="Save for later"
      avoidKeyboard
      footer={
        <Button onClick={handleSave} className="w-full">
          Save game
        </Button>
      }
    >
      <div className="pb-1">
        <SectionLabel as="label" htmlFor="pause-name" className="text-[11px]">
          Game name
        </SectionLabel>
        <Input
          id="pause-name"
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
          className="mt-1.5 mr-1 w-[calc(100%-4px)]"
        />
        <p className="text-sm font-medium text-subtle mt-2.5 leading-relaxed">
          Pick up right where you left off from History → Saved.
        </p>
      </div>
    </BottomSheetModal>
  );
}

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import { PlayerTile } from "./neo";

const stepperClass = "neo-press w-14 h-14 flex items-center justify-center bg-surface border-3 border-ink rounded-xl shadow-neo disabled:opacity-40 disabled:shadow-none";

const ODD_OPTIONS = [3, 5, 7, 9, 11, 13, 15];

export default function BestOfModal({ isOpen, onConfirm, onClose }) {
  const [bestOf, setBestOf] = useState(7);

  const winsNeeded = Math.ceil(bestOf / 2);

  const decrement = () => {
    const idx = ODD_OPTIONS.indexOf(bestOf);
    if (idx > 0) setBestOf(ODD_OPTIONS[idx - 1]);
  };

  const increment = () => {
    const idx = ODD_OPTIONS.indexOf(bestOf);
    if (idx < ODD_OPTIONS.length - 1) setBestOf(ODD_OPTIONS[idx + 1]);
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      leading={<PlayerTile icon="trophy" color="#FFD23F" size={46} radius={11} />}
      eyebrow="Best Of"
      title="How many games?"
      footer={
        <div className="grid grid-cols-2 gap-3.5">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={() => onConfirm(bestOf)}>
            Start game
          </Button>
        </div>
      }
    >
      <div className="mr-1 flex items-center justify-between gap-4 px-3 py-4 bg-surface border-3 border-ink rounded-[14px] shadow-neo">
        <button onClick={decrement} disabled={bestOf === ODD_OPTIONS[0]} aria-label="Fewer games" className={stepperClass}>
          <Minus size={22} strokeWidth={3} />
        </button>
        <span className="font-display text-6xl leading-none">{bestOf}</span>
        <button onClick={increment} disabled={bestOf === ODD_OPTIONS[ODD_OPTIONS.length - 1]} aria-label="More games" className={stepperClass}>
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      <p className="font-mono text-center text-xs font-bold tracking-[0.1em] uppercase pt-4 pb-1">
        First to {winsNeeded} wins takes it all
      </p>
    </BottomSheetModal>
  );
}
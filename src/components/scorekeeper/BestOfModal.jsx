import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

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
      eyebrow="Best Of"
      title="How many games?"
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(bestOf)}
            className="flex-1 h-11 bg-white hover:bg-white/90 font-semibold"
            style={{ color: "#001321", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
          >
            Start Game
          </Button>
        </div>
      }
    >
      {/* Stepper */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <button
          onClick={decrement}
          disabled={bestOf === ODD_OPTIONS[0]}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 transition-opacity"
        >
          <Minus size={20} strokeWidth={2} />
        </button>

        <div className="text-center min-w-[80px]">
          <span className="text-5xl font-bold font-display" style={{ color: "hsl(var(--foreground))" }}>
            {bestOf}
          </span>
          <p className="text-xs text-muted-foreground mt-1">total games</p>
        </div>

        <button
          onClick={increment}
          disabled={bestOf === ODD_OPTIONS[ODD_OPTIONS.length - 1]}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 transition-opacity"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground pb-2">
        First to <span className="font-semibold text-foreground">{winsNeeded}</span> wins takes it all
      </p>
    </BottomSheetModal>
  );
}
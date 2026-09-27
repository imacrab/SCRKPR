import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

export default function ResetConfirmModal({ isOpen, onConfirm, onClose }) {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<RotateCcw size={30} strokeWidth={2.75} />}
      eyebrow="Confirm"
      title="Reset all scores?"
      description="This clears every player's score for the current game. Players stay put."
      footer={
        <div className="grid grid-cols-2 gap-3.5">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={() => { onConfirm(); onClose(); }} variant="destructive">
            Reset
          </Button>
        </div>
      }
    >
      <div className="pb-1" />
    </BottomSheetModal>
  );
}

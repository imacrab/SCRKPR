import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

export default function ResetConfirmModal({ isOpen, onConfirm, onClose }) {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Confirm"
      title="Reset all scores?"
      description="This will clear every player's score for the current game. Players remain."
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 h-11 bg-accent-red hover:bg-accent-red/90 text-white font-semibold"
          >
            Reset
          </Button>
        </div>
      }
    >
      <div className="pb-2" />
    </BottomSheetModal>
  );
}
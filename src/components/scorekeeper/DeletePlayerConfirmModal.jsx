import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

export default function DeletePlayerConfirmModal({ isOpen, playerName, onConfirm, onClose }) {
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      eyebrow="Confirm"
      title={`Delete ${playerName || "this player"}?`}
      description="This will permanently remove the player from your saved players. This can't be undone."
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-11 bg-accent-red hover:bg-accent-red/90 text-white font-semibold"
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="pb-2" />
    </BottomSheetModal>
  );
}
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";

export default function DeletePlayerConfirmModal({ isOpen, playerName, count = 1, onConfirm, onClose }) {
  const isBulk = count > 1;
  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      icon={<Trash2 size={30} strokeWidth={2.5} />}
      eyebrow="Confirm"
      title={isBulk ? `Delete ${count} players?` : `Delete ${playerName || "this player"}?`}
      description={isBulk
        ? `This will permanently remove ${count} players from your saved players. This can't be undone.`
        : "This will permanently remove the player from your saved players. This can't be undone."}
      footer={
        <div className="grid grid-cols-2 gap-3.5">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            Delete
          </Button>
        </div>
      }
    >
      <div className="pb-1" />
    </BottomSheetModal>
  );
}

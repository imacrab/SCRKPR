import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberPad from "./NumberPad";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import { SPRING_SNAPPY } from "@/lib/motion";

export default function ScoreInputModal({ player, editingIndex, isOpen, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const prevValue = useRef("");
  const renderedPlayer = useRef(null);
  const renderedEditingIndex = useRef(null);
  const [digitKey, setDigitKey] = useState(0);

  if (player) {
    renderedPlayer.current = player;
    renderedEditingIndex.current = editingIndex;
  }

  const handleChange = (newVal) => {
    if (newVal !== prevValue.current) {
      prevValue.current = newVal;
      setDigitKey((k) => k + 1);
    }
    setValue(newVal);
  };

  useEffect(() => {
    if (isOpen) {
      setValue("");
      prevValue.current = "";
      setDigitKey(0);
    }
  }, [isOpen, player?.id, editingIndex]);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onSubmit(num);
    setValue("");
  };

  const displayPlayer = player || renderedPlayer.current;
  const displayEditingIndex = player ? editingIndex : renderedEditingIndex.current;
  const isEditing = displayEditingIndex !== null && displayEditingIndex !== undefined;
  const isValid = value !== "" && value !== "-" && !isNaN(parseFloat(value));

  if (!displayPlayer) return null;

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={isEditing ? "Edit Score" : "Add Score"}
      title={displayPlayer.name}
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 h-11 bg-white hover:bg-white/90 font-semibold"
            style={{ color: "#001321" }}
          >
            {isEditing ? "Update" : "Add Score"}
          </Button>
        </div>
      }
    >
      {/* Display */}
      <div className="text-center mb-4">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={digitKey}
            initial={{ opacity: 0, y: -14, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.8 }}
            transition={SPRING_SNAPPY}
            className="text-5xl font-bold inline-block"
            style={{ color: value === "" ? "rgba(150,150,150,0.3)" : "#FFFFFF" }}
          >
            {value === "" ? "0" : value}
          </motion.span>
        </AnimatePresence>
        <div className="mt-3 h-px bg-border mx-6" />
      </div>

      {/* Number pad */}
      <div className="pb-2">
        <NumberPad value={value} onChange={handleChange} />
      </div>
    </BottomSheetModal>
  );
}
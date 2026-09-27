import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberPad from "./NumberPad";
import { Button } from "@/components/ui/button";
import BottomSheetModal from "./BottomSheetModal";
import { PlayerTile, HeaderLink } from "./neo";
import { toNeoColor } from "@/lib/colors";
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
    // An empty pad reads as "0" on screen, so submitting it logs 0 — this is
    // how you close a round for a player who scored nothing (e.g. Gin Rummy).
    const num = value === "" ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    onSubmit(num);
    setValue("");
  };

  const displayPlayer = player || renderedPlayer.current;
  const displayEditingIndex = player ? editingIndex : renderedEditingIndex.current;
  const isEditing = displayEditingIndex !== null && displayEditingIndex !== undefined;
  // Empty is valid — it submits 0 (matches the "0" shown on the pad). Only a
  // lone "-" or malformed input disables the button.
  const isValid = value === "" || (value !== "-" && !isNaN(parseFloat(value)));

  if (!displayPlayer) return null;

  const scores = displayPlayer.scores || [];
  const total = scores.reduce((sum, n) => sum + n, 0);
  const entered = value === "" || value === "-" ? 0 : parseFloat(value) || 0;
  const newTotal = isEditing ? total - (scores[displayEditingIndex] ?? 0) + entered : total + entered;
  const shown = value === "" ? "0" : value.startsWith("-") ? `−${value.slice(1)}` : `+${value}`;

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      leading={<PlayerTile emoji={displayPlayer.emoji} color={toNeoColor(displayPlayer.color)} size={46} radius={11} />}
      eyebrow={isEditing ? `Edit round ${displayEditingIndex + 1}` : "Add Score"}
      title={displayPlayer.name}
      trailing={<HeaderLink onClick={() => handleChange("")}>Clear</HeaderLink>}
      footer={
        <div className="grid grid-cols-2 gap-3.5">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? "Update" : value === "" || value === "-" ? "Add score" : `Add ${value.replace("-", "−")}`}
          </Button>
        </div>
      }
    >
      <div className="mr-1 h-20 flex items-center justify-between px-[18px] bg-surface border-3 border-ink rounded-[14px] shadow-neo overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={digitKey}
            initial={{ opacity: 0, y: -14, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.8 }}
            transition={SPRING_SNAPPY}
            className="font-display text-5xl leading-none inline-block"
            style={{ color: value === "" ? "rgb(var(--dash))" : "rgb(var(--fg))" }}
          >
            {shown}
          </motion.span>
        </AnimatePresence>
        <div className="font-mono text-right text-xs font-bold leading-normal">
          <div className="text-subtle">NEW TOTAL</div>
          <div className="text-base">{total} → {newTotal}</div>
        </div>
      </div>

      <div className="pt-4">
        <NumberPad value={value} onChange={handleChange} />
      </div>
    </BottomSheetModal>
  );
}

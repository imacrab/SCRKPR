import { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

/**
 * iOS-style swipe-to-reveal row. Wrap the actual row content as children —
 * dragging left uncovers a red delete action pinned to the right edge; tapping
 * it fires onDelete. Any tap outside a revealed row closes it. Disabled while
 * `disabled` is true (e.g. select mode is active).
 */
const ACTION_WIDTH = 88; // px — the visible delete pill area
const OPEN_THRESHOLD = ACTION_WIDTH * 0.5;

export default function SwipeableRow({ children, onDelete, disabled = false }) {
  const [offset, setOffset] = useState(0); // negative = revealed
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const axisRef = useRef(null); // "x" | "y" | null — locked after first movement
  const rootRef = useRef(null);
  const suppressClickRef = useRef(false);

  const isOpen = offset <= -OPEN_THRESHOLD;

  // Any tap outside the row while open snaps it closed.
  useEffect(() => {
    if (offset === 0) return;
    const onDocPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOffset(0);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [offset]);

  // Close automatically if the parent disables swiping (e.g. entering select mode).
  useEffect(() => {
    if (disabled) setOffset(0);
  }, [disabled]);

  const onPointerDown = (e) => {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startXRef.current = e.clientX;
    startOffsetRef.current = offset;
    axisRef.current = null;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - (e.movementY ? e.clientY - e.movementY : e.clientY);

    // Axis lock: don't hijack vertical scrolling. Once we lock to "x", we own
    // the gesture; once locked to "y", we bail and let the list scroll.
    if (axisRef.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisRef.current === "y") {
        setDragging(false);
        return;
      }
    }

    // Rubber-band past the action width so you can't yank it clear across.
    let next = startOffsetRef.current + dx;
    if (next > 0) next = next * 0.35; // resist opening to the right
    if (next < -ACTION_WIDTH) next = -ACTION_WIDTH + (next + ACTION_WIDTH) * 0.35;
    setOffset(next);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (axisRef.current !== "x") return;
    // Snap open/closed based on where the release lands.
    const target = offset <= -OPEN_THRESHOLD ? -ACTION_WIDTH : 0;
    setOffset(target);
    // If we swiped a meaningful distance, swallow the tap that would follow.
    if (Math.abs(offset - startOffsetRef.current) > 6) {
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 300);
    }
  };

  const onClickCapture = (e) => {
    // If the row was open, first tap just closes it.
    if (isOpen) {
      e.stopPropagation();
      e.preventDefault();
      setOffset(0);
      return;
    }
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setOffset(0);
    onDelete?.();
  };

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-lg"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {/* Delete action — fixed to the right edge, revealed as the row slides. */}
      <button
        type="button"
        aria-label="Delete player"
        onClick={handleDelete}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-accent-red text-white"
        style={{ width: ACTION_WIDTH }}
        tabIndex={isOpen ? 0 : -1}
      >
        <Trash2 size={20} strokeWidth={2.25} />
      </button>

      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
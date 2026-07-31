import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { SPRING_SHEET, TRANSITION_FADE } from "@/lib/motion";

/**
 * BottomSheetModal — the standardized modal shell used across the app.
 *
 * Matches the End Game modal "gold standard":
 *  - black/60 backdrop with 4px blur
 *  - card sheet with 44px radius, 8px inset from screen edges
 *  - spring entry (stiffness 400, damping 35)
 *  - drag-to-dismiss handle at the top
 *  - eyebrow + display title header
 *  - sticky footer (optional) with safe-area padding
 */
export default function BottomSheetModal({
  isOpen,
  onClose,
  icon,
  eyebrow,
  title,
  description,
  children,
  footer,
  zIndex = 50,
  scrollable = false,
  fullHeight = false,
}) {
  const dragControls = useDragControls();
  const [scrolled, setScrolled] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  // Track how much of the viewport the iOS software keyboard is covering.
  // window.visualViewport shrinks when the keyboard opens; the difference
  // between innerHeight and visualViewport.height is the keyboard's height.
  // We subtract this from the sheet's maxHeight so the sheet's TOP stays
  // above the keyboard instead of getting pushed off-screen — the sheet is
  // bottom-anchored (bottom: 8px) and its body is overflow-y-auto, so no
  // content is lost.
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return undefined;
    }

    const timeout = setTimeout(() => setShouldRender(false), 420);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setKeyboardInset(0);
      return undefined;
    }
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isOpen]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  const backdropZ = zIndex - 10;

  if (!shouldRender) return null;

  // Portal to <body> so the modal escapes the page wrapper's stacking context
  // (the page is transformed/blurred during transitions, which traps any
  // z-index inside it). At the document root the backdrop/sheet sit above the
  // app-level persistent logo, so the backdrop dims it naturally.
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
        animate={{
          opacity: isOpen ? 1 : 0,
          backdropFilter: isOpen ? "blur(4px)" : "blur(0px)",
          WebkitBackdropFilter: isOpen ? "blur(4px)" : "blur(0px)",
        }}
        transition={TRANSITION_FADE}
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: backdropZ, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: isOpen ? 0 : "100%", opacity: isOpen ? 1 : 0 }}
        transition={SPRING_SHEET}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 bg-card border border-border rounded-sheet shadow-2xl flex flex-col"
        style={{
          zIndex,
          // Anchor above the software keyboard when it's up; otherwise 8px from
          // the screen edge. Without this the sheet stays glued to the bottom
          // of the window and the keyboard covers the input.
          bottom: keyboardInset > 0 ? `${keyboardInset + 8}px` : "8px",
          left: "8px",
          right: "8px",
          // Cap the sheet's top so it can't slide under the notch/dynamic island,
          // AND shrink to leave room for the keyboard when it opens. The sheet
          // is bottom-anchored, so shrinking max-height just leaves clearance at
          // the top — the body is `overflow-y-auto`, so no content is unreachable.
          maxHeight: `calc(100dvh - 56px - env(safe-area-inset-top) - ${keyboardInset}px)`,
          // fullHeight locks the sheet to that maxHeight so its size doesn't
          // change as inner content swaps (e.g. switching tabs) — prevents jump.
          ...(fullHeight ? { height: `calc(100dvh - 56px - env(safe-area-inset-top) - ${keyboardInset}px)` } : {}),
        }}
      >
            {/* Drag handle + Header (both draggable) — border fades in once the body scrolls */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className={`flex-shrink-0 touch-none select-none cursor-grab active:cursor-grabbing border-b transition-colors duration-200 ${
                scrollable && scrolled ? "border-border" : "border-transparent"
              }`}
            >
              <div className="pt-3 pb-2">
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              </div>

              {(icon || eyebrow || title) && (
                <div className="text-center px-5 pt-2 pb-5">
                  {icon && (
                    <div className="flex justify-center mb-3 text-white">{icon}</div>
                  )}
                  {eyebrow && (
                    <p className="text-xs font-medium text-white/60 uppercase tracking-widest mb-0.5">
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-white/70 mt-2">{description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Body — content scrolls and clips cleanly under the header, whose
                border-b fades in once scrolled (the crisp top "cap"). */}
            <div
              className={scrollable ? "flex-1 overflow-y-auto px-5 pb-4" : "flex-shrink-0 px-5"}
              onScroll={scrollable ? (e) => setScrolled(e.currentTarget.scrollTop > 0) : undefined}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className={`flex-shrink-0 px-5 pt-3 pb-6 ${scrollable ? "border-t border-border" : ""}`}
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              >
                {footer}
              </div>
            )}
      </motion.div>
    </>,
    document.body
  );
}
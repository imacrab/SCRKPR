import { motion, AnimatePresence, useDragControls } from "framer-motion";

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
  eyebrow,
  title,
  description,
  children,
  footer,
  zIndex = 50,
  scrollable = false,
}) {
  const dragControls = useDragControls();

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  const backdropZ = zIndex - 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px]"
            style={{ zIndex: backdropZ }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bg-card border border-border rounded-[44px] shadow-2xl flex flex-col"
            style={{ zIndex, bottom: "8px", left: "8px", right: "8px", maxHeight: "calc(100dvh - 48px)" }}
          >
            {/* Drag handle + Header (both draggable) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex-shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
            >
              <div className="pt-3 pb-2">
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              </div>

              {(eyebrow || title) && (
                <div className="text-center px-5 pt-2 pb-5">
                  {eyebrow && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div className={scrollable ? "flex-1 overflow-y-auto px-5" : "flex-shrink-0 px-5"}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex-shrink-0 px-5 pt-3 pb-6"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { SPRING_SHEET, TRANSITION_FADE } from "@/lib/motion";
import { useWideLayout } from "@/lib/useWideLayout";

export default function BottomSheetModal({
  isOpen,
  onClose,
  icon,
  iconColor = "#FF4B3E",
  leading,
  trailing,
  eyebrow,
  title,
  description,
  children,
  footer,
  zIndex = 50,
  scrollable = false,
  fullHeight = false,
  avoidKeyboard = false,
  wideMaxWidth = 560,
}) {
  const dragControls = useDragControls();
  const wide = useWideLayout();
  const [scrolled, setScrolled] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return undefined;
    }

    const timeout = setTimeout(() => setShouldRender(false), 420);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // iOS Safari quirk: when a text input inside a `position: fixed` element
  // gets focus, iOS scrolls the DOCUMENT to bring the input into view — and
  // it drags fixed elements along with that scroll. The sheet then appears
  // to "move up with the keyboard" even though we removed all keyboard
  // tracking. Fix: while the modal is open, force the document scroll
  // position back to 0 on every scroll event.
  useEffect(() => {
    if (!isOpen) return undefined;
    const pin = () => {
      if (window.scrollY !== 0 || window.pageYOffset !== 0) {
        window.scrollTo(0, 0);
      }
    };
    pin();
    window.addEventListener("scroll", pin, { passive: true });
    return () => window.removeEventListener("scroll", pin);
  }, [isOpen]);

  // Opt-in keyboard avoidance: when `avoidKeyboard` is set, lift the sheet to
  // sit above the software keyboard so inputs near the bottom stay visible
  // while typing. Modals whose inputs sit high (under the header) opt out and
  // keep the overlay behavior.
  //
  // Preferred signal: the native Capacitor Keyboard plugin's keyboardWillShow
  // event, which reports the exact keyboard height. Inside the iOS WKWebView
  // (Keyboard resize: "none") `visualViewport` never shrinks for the keyboard,
  // so the web fallback below would always compute 0. The plugin must be
  // imported — Capacitor only exposes a plugin once its JS package registers it.
  // Falls back to the visualViewport API on the web / PWA.
  useEffect(() => {
    if (!isOpen || !avoidKeyboard) return undefined;

    if (window.Capacitor?.isNativePlatform?.()) {
      let cancelled = false;
      let handles = [];
      import("@capacitor/keyboard")
        .then(({ Keyboard }) => Promise.all([
          Keyboard.addListener("keyboardWillShow", (info) => setKeyboardInset(info?.keyboardHeight || 0)),
          Keyboard.addListener("keyboardWillHide", () => setKeyboardInset(0)),
        ]))
        .then((added) => {
          if (cancelled) added.forEach((h) => h.remove());
          else handles = added;
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        handles.forEach((h) => h.remove());
        setKeyboardInset(0);
      };
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
      setKeyboardInset(0);
    };
  }, [isOpen, avoidKeyboard]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  const backdropZ = zIndex - 10;
  // The keyboard's height already covers the home-indicator area, so while it's
  // up the sheet only needs a small gap instead of the safe-area inset.
  const bottom = keyboardInset > 0 ? `${keyboardInset + 12}px` : "max(16px, env(safe-area-inset-bottom))";
  const availableHeight = `calc(100dvh - 40px - env(safe-area-inset-top) - ${bottom})`;

  if (!shouldRender) return null;

  const sheetContent = (
    <>
      <div
        onPointerDown={wide ? undefined : (e) => dragControls.start(e)}
        className={`flex-shrink-0 touch-none select-none ${wide ? "" : "cursor-grab active:cursor-grabbing"} border-b-[2.5px] transition-colors duration-200 ${
          scrollable && scrolled ? "border-ink" : "border-transparent"
        }`}
      >
        {icon ? (
          <div className="flex flex-col items-center text-center px-5 pt-[30px] pb-5">
            <div
              className="w-16 h-16 flex items-center justify-center text-ink border-3 border-ink rounded-2xl shadow-neo"
              style={{ background: iconColor, transform: "rotate(-6deg)" }}
            >
              {icon}
            </div>
            {eyebrow && (
              <p className="font-mono mt-5 text-xs font-bold tracking-[0.14em] uppercase">{eyebrow}</p>
            )}
            {title && (
              <h2 className={`font-display ${eyebrow ? "mt-1.5" : "mt-5"} text-[28px] leading-[1.1] uppercase`}>{title}</h2>
            )}
            {description && (
              <p className="mt-3 text-base leading-[1.45] font-medium text-subtle max-w-[290px]">{description}</p>
            )}
          </div>
        ) : (eyebrow || title || leading || trailing) ? (
          <div className="flex items-center gap-3 px-[18px] pt-[22px] pb-4">
            {leading}
            <div className="flex-1 min-w-0">
              {eyebrow && (
                <p className="font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-subtle">{eyebrow}</p>
              )}
              {title && (
                <h2 className="font-display mt-0.5 text-2xl leading-[1.1] uppercase line-clamp-2 break-words">{title}</h2>
              )}
              {description && (
                <p className="mt-2 text-[15px] leading-[1.45] font-medium text-subtle">{description}</p>
              )}
            </div>
            {trailing && <span className="flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>{trailing}</span>}
          </div>
        ) : (
          <div className="h-[22px]" />
        )}
      </div>

      <div
        className={scrollable ? `flex-1 overflow-y-auto px-[18px] ${fullHeight ? "" : "pb-4"}` : "flex-shrink-0 px-[18px]"}
        onScroll={scrollable ? (e) => setScrolled(e.currentTarget.scrollTop > 0) : undefined}
      >
        {children}
      </div>

      {footer && (
        <div className={`flex-shrink-0 pl-[18px] pr-[22px] pt-4 pb-[18px] ${scrollable ? "border-t-[2.5px] border-ink" : ""}`}>
          {footer}
        </div>
      )}
    </>
  );

  // Portal to <body> so the modal escapes the page wrapper's stacking context
  // (the page is transformed/blurred during transitions, which traps any
  // z-index inside it). At the document root the backdrop/sheet sit above the
  // app-level persistent logo, so the backdrop dims it naturally.
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={TRANSITION_FADE}
        className="fixed inset-0 bg-[rgba(17,17,17,0.62)]"
        style={{ zIndex: backdropZ, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={onClose}
      />
      {wide ? (
        // Tablets get a centered dialog: a bottom sheet stretched across a
        // 13" screen reads as a banner, and it's far from the thumb anyway.
        <div
          className="fixed inset-0 flex items-center justify-center px-8 pointer-events-none"
          style={{ zIndex, paddingBottom: keyboardInset, transition: "padding-bottom 0.25s ease" }}
        >
          <motion.div
            initial={{ y: 40, scale: 0.97, opacity: 0 }}
            animate={isOpen ? { y: 0, scale: 1, opacity: 1 } : { y: 40, scale: 0.97, opacity: 0 }}
            transition={SPRING_SHEET}
            className="w-full bg-paper text-fg border-3 border-ink rounded-[22px] shadow-neo-lg flex flex-col"
            style={{
              maxWidth: wideMaxWidth,
              pointerEvents: isOpen ? "auto" : "none",
              maxHeight: `calc(100dvh - 80px - ${keyboardInset}px)`,
              ...(fullHeight ? { height: `min(780px, calc(100dvh - 80px - ${keyboardInset}px))` } : {}),
            }}
          >
            {sheetContent}
          </motion.div>
        </div>
      ) : (
      <motion.div
        initial={{ y: "110%", opacity: 0 }}
        animate={{ y: isOpen ? 0 : "110%", opacity: isOpen ? 1 : 0 }}
        transition={SPRING_SHEET}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        className="fixed bg-paper text-fg border-3 border-ink rounded-[22px] shadow-neo-lg flex flex-col"
        style={{
          zIndex,
          bottom,
          left: "16px",
          right: "22px",
          // Keeps the sheet's top clear of the notch / dynamic island.
          maxHeight: availableHeight,
          ...(fullHeight ? { height: availableHeight } : {}),
          transition: "bottom 0.25s ease, max-height 0.25s ease",
        }}
      >
        {sheetContent}
      </motion.div>
      )}
    </>,
    document.body
  );
}
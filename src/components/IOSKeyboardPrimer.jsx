import { useEffect, useRef } from "react";
import { registerPrimerElement } from "@/lib/iosKeyboardPrimer";

// Permanently-mounted, invisible input that lives at the app root. Its ONLY
// job is to receive focus() synchronously inside a tap event so iOS agrees to
// raise the software keyboard. When the real modal input mounts a moment
// later, it steals focus and the keyboard stays up.
//
// The element must be visible enough to iOS's "is this focusable" check —
// display:none / visibility:hidden / 0×0 will make iOS reject the focus. We
// use an off-screen absolute position with an opaque 1×1 footprint.
export default function IOSKeyboardPrimer() {
  const ref = useRef(null);

  useEffect(() => {
    registerPrimerElement(ref.current);
    return () => registerPrimerElement(null);
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      aria-hidden="true"
      tabIndex={-1}
      // readOnly would block iOS from raising the keyboard; keep it writable.
      // The input never actually receives typed characters because focus is
      // stolen by the real input on the very next frame.
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
        border: 0,
        padding: 0,
        margin: 0,
        zIndex: -1,
      }}
    />
  );
}
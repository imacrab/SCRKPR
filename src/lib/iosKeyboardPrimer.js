// iOS Keyboard Primer
// -------------------
// iOS Safari will ONLY raise the software keyboard when focus() runs
// synchronously inside a user-gesture event (touchend/click). Our
// PlayerEditModal opens via a React state update — by the time the modal
// portal mounts and its <input> exists, we're several frames outside that
// gesture window and iOS silently refuses the keyboard.
//
// The workaround (used by native web apps like Twitter/X and Notion): keep a
// permanently-mounted, invisible <input> in the document. When the user taps
// something that will open a modal, we focus() that hidden input FIRST — still
// inside the tap's gesture — so iOS raises the keyboard immediately. Once the
// real input mounts, it steals focus (iOS keeps the keyboard up across focus
// transfers within the same gesture window).
//
// Usage:
//   1. Render <IOSKeyboardPrimer /> once at the app root.
//   2. Add `onPointerDown={primeIOSKeyboard}` to the button that opens the modal.

let primerEl = null;

export function registerPrimerElement(el) {
  primerEl = el;
}

export function primeIOSKeyboard() {
  if (!primerEl) return;
  try {
    primerEl.focus({ preventScroll: true });
  } catch {
    // ignore
  }
}
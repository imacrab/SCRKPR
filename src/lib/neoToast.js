import { useSyncExternalStore } from "react";

const TOAST_DURATION_MS = 5000;

let current = null;
let hideTimer;
const listeners = new Set();

function publish(next) {
  current = next;
  listeners.forEach((listener) => listener());
}

// One toast at a time: a new one replaces the old, which animates out.
export function showToast(message) {
  clearTimeout(hideTimer);
  publish({ id: Date.now(), message });
  hideTimer = setTimeout(() => publish(null), TOAST_DURATION_MS);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCurrentToast() {
  return useSyncExternalStore(subscribe, () => current);
}

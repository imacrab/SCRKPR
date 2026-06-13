// First-time user experience (FTUE) flag — local only.
//
// Tracks whether someone has seen the welcome flow so it shows exactly once on
// first launch. Bump ONBOARDING_VERSION if the intro changes enough that even
// returning users should see it again. resetOnboarding() exists so the flow can
// be replayed (Settings → "Replay welcome", and window.scrkprReplayIntro() in dev).

const KEY = "scrkpr_onboarded";
const ONBOARDING_VERSION = "1";

export function hasOnboarded() {
  try {
    return localStorage.getItem(KEY) === ONBOARDING_VERSION;
  } catch {
    return false;
  }
}

export function setOnboarded() {
  try {
    localStorage.setItem(KEY, ONBOARDING_VERSION);
  } catch (e) {
    console.error("[onboarding] failed to persist flag:", e);
  }
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error("[onboarding] failed to reset flag:", e);
  }
}

// Dev/iteration convenience: replay the intro from the browser console.
if (typeof window !== "undefined") {
  window.scrkprReplayIntro = () => {
    resetOnboarding();
    window.location.href = "/";
  };
}

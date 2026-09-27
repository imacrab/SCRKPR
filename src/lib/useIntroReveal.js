import { useEffect, useState } from "react";
import { hasOnboarded } from "./onboarding";
import { SPRING_ENTER } from "./motion";

export const ONBOARDING_DONE_EVENT = "scrkpr:onboarding-done";

// While the first-run intro is up, the screen underneath stays hidden; once the
// intro finishes it plays a staggered entrance instead of simply being uncovered.
export function useIntroReveal() {
  const [phase, setPhase] = useState(() => (hasOnboarded() ? "done" : "hidden"));

  useEffect(() => {
    if (phase !== "hidden") return undefined;
    const play = () => setPhase("play");
    window.addEventListener(ONBOARDING_DONE_EVENT, play);
    return () => window.removeEventListener(ONBOARDING_DONE_EVENT, play);
  }, [phase]);

  const reveal = (index, { baseDelay = 0.1, step = 0.07 } = {}) => {
    if (phase === "done") return {};
    return {
      initial: { opacity: 0, y: 28, scale: 0.97 },
      animate: phase === "play" ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.97 },
      transition: { ...SPRING_ENTER, delay: baseDelay + index * step },
    };
  };

  return { phase, reveal };
}

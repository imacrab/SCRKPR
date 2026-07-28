import { useEffect, useState } from "react";
import { preloadPlayerEmojis } from "@/lib/preloadEmojis";

// Full-screen loading gate. Warms the emoji cache before revealing the app so
// the UI doesn't "pop" as assets stream in. Shows a 0–100 percentage that
// tracks real preload progress. Design is deliberately bare — placeholder for
// a proper treatment later.
export default function LoadingScreen({ onReady }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let alive = true;
    // Minimum on-screen time keeps the number from flashing by so fast the
    // user can't read it, without adding artificial delay on slow networks.
    const startedAt = performance.now();
    const MIN_MS = 400;

    preloadPlayerEmojis((p) => {
      if (!alive) return;
      setPercent(Math.round(p * 100));
    }).then(() => {
      if (!alive) return;
      setPercent(100);
      const elapsed = performance.now() - startedAt;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => alive && onReady?.(), wait);
    });

    return () => { alive = false; };
  }, [onReady]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="[font-family:'Geist',_sans-serif] font-medium text-white tabular-nums"
        style={{ fontSize: 48 }}
      >
        {percent}
      </div>
    </div>
  );
}
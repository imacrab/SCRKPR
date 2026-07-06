import { useEffect, useRef } from "react";

const STRETCH_DURATION_MS = 300;

export default function StretchTabPill({ activeIndex, previousIndex, onSettle }) {
  const onSettleRef = useRef(onSettle);
  const moving = previousIndex !== activeIndex;
  const movingRight = activeIndex > previousIndex;

  const previousX = previousIndex === 0 ? "0%" : "100%";
  const activeX = activeIndex === 0 ? "0%" : "100%";

  useEffect(() => {
    onSettleRef.current = onSettle;
  }, [onSettle]);

  useEffect(() => {
    if (!moving) return undefined;

    const settleTimer = window.setTimeout(() => {
      onSettleRef.current?.();
    }, STRETCH_DURATION_MS + 40);

    return () => window.clearTimeout(settleTimer);
  }, [activeIndex, moving, previousIndex]);

  return (
    <div
      key={moving ? `${previousIndex}-${activeIndex}` : "settled"}
      aria-hidden="true"
      className={`stretch-tab-pill absolute left-1 top-1 bottom-1 origin-left rounded-full bg-card border border-border shadow-sm ${moving ? "stretch-tab-pill--moving" : ""}`}
      style={{
        "--from-x": previousX,
        "--mid-x": movingRight ? previousX : "0%",
        "--to-x": activeX,
        transform: `translateX(${activeX}) scaleX(1)`,
        width: "calc((100% - 8px) / 2)",
      }}
    />
  );
}

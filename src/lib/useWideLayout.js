import { useEffect, useState } from "react";

// Matches Tailwind's `lg` screen, so structural switches here and `lg:` styles
// always agree. No iPhone reaches 1024pt, even in landscape.
const WIDE_QUERY = "(min-width: 1024px)";

const matchesWide = () => typeof window !== "undefined" && !!window.matchMedia?.(WIDE_QUERY).matches;

export function useWideLayout() {
  const [wide, setWide] = useState(matchesWide);

  useEffect(() => {
    const mql = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return wide;
}

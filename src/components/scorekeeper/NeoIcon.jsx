import { resolveIcon } from "@/lib/playerIcons";

// Lucide ships outlines only. Filling with currentColor and stroking in the
// background color turns the inner detail lines into cut-outs.
export default function NeoIcon({ name, size = 24, knockout = "rgb(var(--surface))", strokeWidth = 2, className = "", style }) {
  const Icon = resolveIcon(name);
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      fill="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
      style={{ stroke: knockout, ...style }}
    />
  );
}

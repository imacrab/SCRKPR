import { resolveIcon } from "@/lib/playerIcons";

export default function NeoIcon({ name, size = 24, strokeWidth = 2, className = "", style }) {
  const Icon = resolveIcon(name);
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
      style={style}
    />
  );
}

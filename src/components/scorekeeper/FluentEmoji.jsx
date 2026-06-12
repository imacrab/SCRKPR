// Renders a Microsoft Fluent Emoji (3D) image from the lobehub CDN.
// Falls back to the native unicode emoji if the image fails to load.

import { useState, useEffect } from "react";

function emojiToCodepoint(emoji) {
  if (!emoji) return "";
  const codepoints = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    // Skip the variation selector (FE0F) for most assets — Fluent's filename
    // conventions vary. We keep it for emojis that require it (☺️, ♠️, etc.)
    codepoints.push(cp.toString(16));
  }
  // Try with full codepoints first
  return codepoints.join("-");
}

const ASSET_BASE = "https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/latest/files/assets";

export function getFluentEmojiUrl(emoji) {
  const cp = emojiToCodepoint(emoji);
  if (!cp) return "";
  return `${ASSET_BASE}/${cp}.webp`;
}

export default function FluentEmoji({ emoji, size = 10, className = "", style = {} }) {
  const [failed, setFailed] = useState(false);

  // If the emoji prop changes, give the new asset a fresh chance to load.
  useEffect(() => setFailed(false), [emoji]);

  if (!emoji) return null;

  // Final fallback — native unicode emoji, sized to match the image slot.
  if (failed) {
    return (
      <span
        role="img"
        aria-label={emoji}
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.82, lineHeight: 1, ...style }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={getFluentEmojiUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      draggable={false}
      onError={(e) => {
        // Fallback: try stripping the variation selector (FE0F)
        const stripped = [...emoji].filter((c) => c.codePointAt(0) !== 0xfe0f).join("");
        const fallback = stripped ? getFluentEmojiUrl(stripped) : "";
        if (fallback && e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        } else {
          setFailed(true);
        }
      }}
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size, objectFit: "contain", ...style }}
    />
  );
}
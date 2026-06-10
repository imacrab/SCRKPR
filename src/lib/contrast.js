// WCAG 2.2 contrast utilities + curated palettes that pass AA against
// either white (#FFFFFF) or near-black (#111111) text.

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

// Pick the readable text color for a given background (WCAG-driven).
export function readableTextColor(bg) {
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#111111")
    ? "#FFFFFF"
    : "#111111";
}

// Dark palette → pairs with WHITE text. Each color tested ≥ 4.5:1 vs #FFFFFF.
export const DARK_BG_COLORS = [
  "#B91C1C", // red
  "#C2410C", // orange
  "#A16207", // amber
  "#4D7C0F", // lime
  "#15803D", // green
  "#0F766E", // teal
  "#0E7490", // cyan
  "#1D4ED8", // blue
  "#4338CA", // indigo
  "#6D28D9", // violet
  "#A21CAF", // fuchsia
  "#BE185D", // pink
  "#374151", // slate
  "#1F2937", // dark slate
  "#000000", // black
];

// Light palette → pairs with NEAR-BLACK text. Each color tested ≥ 4.5:1 vs #111111.
export const LIGHT_BG_COLORS = [
  "#FCA5A5", // red 300
  "#FDBA74", // orange 300
  "#FCD34D", // amber 300
  "#FDE047", // yellow 300
  "#BEF264", // lime 300
  "#86EFAC", // green 300
  "#5EEAD4", // teal 300
  "#67E8F9", // cyan 300
  "#7DD3FC", // sky 300
  "#93C5FD", // blue 300
  "#A5B4FC", // indigo 300
  "#C4B5FD", // violet 300
  "#F0ABFC", // fuchsia 300
  "#F9A8D4", // pink 300
  "#FFFFFF", // white
];

export function getPaletteForTone(tone) {
  return tone === "light" ? LIGHT_BG_COLORS : DARK_BG_COLORS;
}
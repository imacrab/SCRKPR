// WCAG 2.2 contrast utilities + curated palettes that pass AA against
// either white (#FFFFFF) or near-black (#001321) text.

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
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#001321")
    ? "#FFFFFF"
    : "#001321";
}

// --- HSL helpers (for lightening) -------------------------------------------
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex({ h, s, l }) {
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to255 = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to255(r)}${to255(g)}${to255(b)}`.toUpperCase();
}

// Convert any color into a bright, playful pastel that pairs with #001321 text.
// Keeps the hue, forces a high lightness and caps saturation so a dark color
// (e.g. a legacy player color) becomes a light-mode-friendly version of itself.
// Colors that are already light are returned essentially unchanged.
export function toLightBg(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  const light = { h: hsl.h, s: Math.min(hsl.s, 0.9), l: Math.max(hsl.l, 0.75) };
  return hslToHex(light);
}

// Dark palette → pairs with WHITE text. Vivid jewel-tone 25-hue wheel: high
// saturation (S90), lightness pushed as bright as AA-vs-white allows so the
// colorful emojis pop. Every color tested ≥ 4.5:1 vs #FFFFFF. (The yellow/green
// arc is necessarily deep — a bright yellow can't hold white text at AA.)
export const DARK_BG_COLORS = [
  "#ED0C0C", // red
  "#DA3D0B", // vermillion
  "#B85D0A", // orange
  "#966E08", // amber-olive
  "#7E7907", // olive
  "#667E07", // moss
  "#4C8307", // green-olive
  "#308807", // green
  "#128A07", // grass
  "#078A1C", // forest
  "#07883B", // emerald
  "#078558", // jade
  "#078576", // teal
  "#088191", // cyan
  "#0A7BBB", // sky
  "#1970F3", // blue
  "#3B59F5", // royal blue
  "#4A3BF5", // indigo
  "#763BF5", // violet
  "#A33BF5", // purple
  "#C20DF0", // magenta
  "#D00BC8", // fuchsia
  "#DC0CA2", // pink
  "#E40C74", // rose
  "#EB0C42", // crimson
];

// Light palette → pairs with NEAR-BLACK text. Vibrant generic 25-hue wheel
// (evenly-stepped hues at S85 / ~L65). Every color tested ≥ 4.5:1 vs #001321;
// the blue-violets are nudged lighter just enough to keep dark text readable.
export const LIGHT_BG_COLORS = [
  "#F25A5A", // red
  "#F27E5A", // vermillion
  "#F2A35A", // orange
  "#F2C75A", // amber
  "#F2EC5A", // yellow
  "#D3F25A", // lime
  "#AFF25A", // yellow-green
  "#8AF25A", // green
  "#66F25A", // grass
  "#5AF272", // spring
  "#5AF297", // mint
  "#5AF2BB", // aqua-green
  "#5AF2DF", // turquoise
  "#5ADFF2", // cyan
  "#5ABBF2", // sky
  "#5A97F2", // azure
  "#5A72F2", // blue
  "#786DF3", // indigo (nudged)
  "#8E5FF2", // violet (nudged)
  "#AF5AF2", // purple
  "#D35AF2", // magenta
  "#F25AEC", // fuchsia
  "#F25AC7", // pink
  "#F25AA3", // rose
  "#F25A7E", // coral-pink
];

export function getPaletteForTone(tone) {
  return tone === "light" ? LIGHT_BG_COLORS : DARK_BG_COLORS;
}
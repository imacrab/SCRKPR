// Theme-aware colors resolve through CSS variables (see index.css) so they
// follow light/dark mode; the vivid fills below stay fixed in both.
export const INK = "rgb(var(--ink))";
export const FG = "rgb(var(--fg))";
export const PAPER = "rgb(var(--paper))";
export const SURFACE = "rgb(var(--surface))";
export const SUBTLE = "rgb(var(--subtle))";
export const PUTTY = "rgb(var(--putty))";
export const HAIRLINE = "rgb(var(--hairline))";
export const FAINT = "rgb(var(--faint))";
export const DASH = "rgb(var(--dash))";

export const SUN = "#FFD23F";
export const DANGER = "#FF4B3E";
export const SUCCESS = "#1FD66F";

export const ACCENT_BLUE = "#1FBFFF";
export const ACCENT_RED = DANGER;

export const NEO_COLORS = [
  { name: "Red", hex: "#FF4B3E" },
  { name: "Orange", hex: "#FF8A1F" },
  { name: "Yellow", hex: "#FFD23F" },
  { name: "Lime", hex: "#B8F02B" },
  { name: "Green", hex: "#1FD66F" },
  { name: "Teal", hex: "#14C9B5" },
  { name: "Cyan", hex: "#1FBFFF" },
  { name: "Blue", hex: "#4C8DFF" },
  { name: "Purple", hex: "#9B6BFF" },
  { name: "Violet", hex: "#D46BFF" },
  { name: "Pink", hex: "#FF4FA0" },
  { name: "Rose", hex: "#FF6B86" },
  { name: "Peach", hex: "#FFA36B" },
  { name: "Sand", hex: "#D9B77E" },
  { name: "White", hex: "#FFFFFF" },
];

export const PLAYER_COLORS = NEO_COLORS.map((c) => c.hex);

export const RANK_COLORS = [SUN, PUTTY, "#FFA36B"];

function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function hueSatLight({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

const NEO_HSL = NEO_COLORS
  .map(({ hex }) => ({ hex, ...hueSatLight(hexToRgb(hex)) }))
  .filter((c) => c.s > 0.3);

const LEGACY_NEO = {
  "#FF5A4E": "#FF4B3E",
  "#FF9A4D": "#FF8A1F",
  "#C6E85B": "#B8F02B",
  "#3DDC84": "#1FD66F",
  "#2EC4B6": "#14C9B5",
  "#3CC8F5": "#1FBFFF",
  "#6FA8FF": "#4C8DFF",
  "#A98BFF": "#9B6BFF",
  "#D98BFF": "#D46BFF",
  "#FF6FAE": "#FF4FA0",
  "#FF8FA3": "#FF6B86",
  "#F2B98A": "#FFA36B",
  "#C9B79C": "#D9B77E",
};

const neoCache = new Map();

// Players saved before the redesign carry colors from the old dark/light
// palettes. Rather than rewrite stored data, render them as the nearest-hue
// swatch from the neo palette so every card keeps readable ink text.
export function toNeoColor(hex) {
  if (!hex) return NEO_COLORS[6].hex;
  const key = hex.toUpperCase();
  if (neoCache.has(key)) return neoCache.get(key);
  let result = LEGACY_NEO[key] || key;
  if (!PLAYER_COLORS.includes(result)) {
    const rgb = hexToRgb(key);
    if (!rgb) {
      result = NEO_COLORS[6].hex;
    } else {
      const { h, s, l } = hueSatLight(rgb);
      if (s < 0.18) {
        result = l > 0.6 ? "#FFFFFF" : "#D9B77E";
      } else {
        const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
        result = NEO_HSL.reduce((best, c) => (hueDistance(c.h, h) < hueDistance(best.h, h) ? c : best)).hex;
      }
    }
  }
  neoCache.set(key, result);
  return result;
}

const byName = Object.fromEntries(NEO_COLORS.map(({ name, hex }) => [name, hex]));

const TWO_TONE_PARTNER = {
  Red: "Cyan",
  Orange: "Blue",
  Yellow: "Purple",
  Lime: "Violet",
  Green: "Pink",
  Teal: "Orange",
  Cyan: "Pink",
  Blue: "Yellow",
  Purple: "Lime",
  Violet: "Green",
  Pink: "Cyan",
  Rose: "Teal",
  Peach: "Blue",
  Sand: "Purple",
  White: "Pink",
};

export function secondTone(hex) {
  const color = NEO_COLORS.find((c) => c.hex === toNeoColor(hex));
  return byName[TWO_TONE_PARTNER[color?.name]] || SUN;
}

export function twoToneBackground(hex, split = 58) {
  const a = toNeoColor(hex);
  const b = secondTone(a);
  return `linear-gradient(135deg, ${a} 0 calc(${split}% - 2px), rgb(var(--ink)) calc(${split}% - 2px) calc(${split}% + 2px), ${b} calc(${split}% + 2px) 100%)`;
}

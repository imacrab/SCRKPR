import { PLAYER_COLORS } from "./colors";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import NeoIcon from "@/components/scorekeeper/NeoIcon";

const SHAPES = {
  square: '<rect x="3" y="3" width="18" height="18" rx="3"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  triangle: '<path d="M12 3 L21 20 L3 20 Z" stroke-linejoin="round"/>',
  star: '<path d="M12 2.5 L14.8 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.4 L12 17 L6.1 20.4 L7.5 13.8 L2.5 9.3 L9.2 8.6 Z" stroke-linejoin="round"/>',
  squiggle: '<path d="M3 15 Q 6 7 9 15 T 15 15 T 21 15" fill="none" stroke-linecap="round" stroke-width="4.5"/>',
};
const SHAPE_NAMES = Object.keys(SHAPES);

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

let layer = null;
function getLayer() {
  if (layer?.isConnected) return layer;
  layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999", overflow: "hidden" });
  document.body.appendChild(layer);
  return layer;
}

function shapePiece(color) {
  const name = pick(SHAPE_NAMES);
  const size = name === "squiggle" ? rand(26, 34) : rand(14, 22);
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.filter = "drop-shadow(2px 2px 0 rgb(var(--ink)))";
  const stroke = name === "squiggle" ? color : "rgb(var(--ink))";
  const fill = name === "squiggle" ? "none" : color;
  el.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="${fill}" stroke="${stroke}" stroke-width="2.5">${SHAPES[name]}</svg>`;
  return el;
}

function iconPiece(icon, color) {
  const el = document.createElement("div");
  const size = rand(40, 52);
  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color,
    border: "3px solid rgb(var(--ink))",
    borderRadius: "11px",
    boxShadow: "3px 3px 0 rgb(var(--ink))",
    color: "rgb(var(--ink))",
  });
  el.innerHTML = renderToStaticMarkup(createElement(NeoIcon, { name: icon, knockout: color, size: "72%" }));
  return el;
}

// Launches from below the screen edge, arcs up, then falls away — a parabola
// approximated with a decelerating rise and an accelerating fall.
function launch(el, { originX, delay }, live) {
  const root = getLayer();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const startX = originX * w;
  const driftX = rand(-0.45, 0.45) * w;
  const peakY = -rand(0.45, 0.95) * h;
  const spin = rand(-720, 720);
  const duration = rand(2200, 3200);

  Object.assign(el.style, { position: "absolute", left: `${startX}px`, top: `${h + 30}px`, willChange: "transform" });
  root.appendChild(el);

  const anim = el.animate(
    [
      { transform: "translate(-50%, 0) rotate(0deg)", easing: "cubic-bezier(0.15, 0.7, 0.35, 1)" },
      { transform: `translate(calc(-50% + ${driftX * 0.55}px), ${peakY}px) rotate(${spin * 0.4}deg)`, offset: 0.38, easing: "cubic-bezier(0.55, 0, 0.9, 0.5)" },
      { transform: `translate(calc(-50% + ${driftX}px), ${h * 0.25}px) rotate(${spin}deg)` },
    ],
    { duration, delay, fill: "backwards" },
  );
  anim.onfinish = () => el.remove();
  live.push(() => {
    if ((anim.currentTime ?? 0) < delay) {
      anim.cancel();
      el.remove();
    }
  });
}

export function fireNeoConfetti({ colors = PLAYER_COLORS, icon, bursts = [{ x: 0.2, delay: 250 }, { x: 0.8, delay: 400 }, { x: 0.5, delay: 600 }], count = 34 } = {}) {
  const live = [];
  // Cancels pieces still waiting to launch; ones already in the air finish.
  const cancel = () => live.forEach((stop) => stop());
  if (typeof window === "undefined") return cancel;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return cancel;

  bursts.forEach(({ x, delay }) => {
    for (let i = 0; i < count; i++) {
      launch(shapePiece(pick(colors)), { originX: x + rand(-0.06, 0.06), delay: delay + rand(0, 120) }, live);
    }
  });

  if (icon) {
    for (let i = 0; i < 9; i++) {
      launch(iconPiece(icon, pick(colors)), { originX: rand(0.25, 0.75), delay: 850 + i * 60 }, live);
    }
  }
  return cancel;
}

// Downloads the Fluent Emoji 3D asset for every emoji literal in src/ into
// public/emoji/, so the app never fetches emoji from a third party at runtime.
// Re-run after adding emoji to the code: `npm run vendor:emoji`.

import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_VERSION = "1.1.0";
const ASSET_BASE = `https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/${PACKAGE_VERSION}/files/assets`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const outDir = path.join(root, "public", "emoji");

const EMOJI_PATTERN = /\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*/gu;

const toCodepoints = (emoji) => [...emoji].map((ch) => ch.codePointAt(0).toString(16)).join("-");
const stripVariationSelector = (emoji) => [...emoji].filter((ch) => ch !== "️").join("");

async function* sourceFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) yield full;
  }
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(emoji) {
  const candidates = [...new Set([toCodepoints(emoji), toCodepoints(stripVariationSelector(emoji))])];
  for (const cp of candidates) {
    const res = await fetch(`${ASSET_BASE}/${cp}.webp`);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

const emojis = new Set();
for await (const file of sourceFiles(srcDir)) {
  for (const match of (await readFile(file, "utf8")).matchAll(EMOJI_PATTERN)) emojis.add(match[0]);
}

await mkdir(outDir, { recursive: true });

const missing = [];
let fetched = 0;
for (const emoji of emojis) {
  const target = path.join(outDir, `${toCodepoints(emoji)}.webp`);
  if (await exists(target)) continue;
  const data = await download(emoji);
  if (!data) {
    missing.push(emoji);
    continue;
  }
  await writeFile(target, data);
  fetched++;
}

console.log(`${emojis.size} emoji in src/, ${fetched} downloaded.`);
if (missing.length) console.log(`No Fluent asset (will render as native emoji): ${missing.join(" ")}`);

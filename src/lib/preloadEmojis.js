// Warms the image cache with every emoji shown in the picker so the Add Player
// modal's grid renders instantly instead of popping in one-by-one on first
// open. Runs off the critical path — kicked off after the app has painted, with
// concurrency capped so it never competes with user interaction.

import { getFluentEmojiUrl } from "@/components/scorekeeper/FluentEmoji";
import { PLAYER_EMOJI_LIBRARY, AUTOFILL_EMOJIS } from "@/components/scorekeeper/EmojiPicker";

let started = false;

export function preloadPlayerEmojis() {
  if (started) return;
  started = true;

  // Autofill set first (used the instant a modal opens with a new player), then
  // the full picker library. De-duped to avoid double fetches.
  const seen = new Set();
  const queue = [];
  const push = (e) => {
    if (!e || seen.has(e)) return;
    seen.add(e);
    queue.push(e);
  };
  AUTOFILL_EMOJIS.forEach(push);
  PLAYER_EMOJI_LIBRARY.forEach((entry) => push(entry?.emoji || entry));

  const CONCURRENCY = 6;
  let cursor = 0;
  const next = () => {
    if (cursor >= queue.length) return;
    const emoji = queue[cursor++];
    const url = getFluentEmojiUrl(emoji);
    if (!url) { next(); return; }
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    const done = () => next();
    img.onload = done;
    img.onerror = done;
    img.src = url;
  };
  for (let i = 0; i < CONCURRENCY; i++) next();
}
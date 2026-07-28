// Warms the browser image cache with every emoji shown in the picker so the
// Add Player modal's grid renders instantly instead of streaming assets in
// one-by-one on first open. Runs off the critical path — kicked off after the
// app has painted, in small batches, with concurrency capped so we don't hammer
// the network or steal bandwidth from anything the user is doing.
//
// Cheap and idempotent: <img>.src into the memory cache; the browser dedupes,
// and later <FluentEmoji> requests reuse the cached response.

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
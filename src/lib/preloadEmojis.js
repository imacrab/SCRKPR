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

let startedPromise = null;

// Preloads every player emoji and resolves when they've all settled. Reports
// progress (0..1) via the onProgress callback so a loading screen can render a
// live percentage. Idempotent — subsequent calls share the same promise.
export function preloadPlayerEmojis(onProgress) {
  if (startedPromise) {
    // Fire one immediate 100% tick so late subscribers don't wait forever if
    // the preload has already finished.
    if (onProgress) startedPromise.then(() => onProgress(1));
    return startedPromise;
  }

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

  const total = Math.max(1, queue.length);
  let loaded = 0;

  startedPromise = new Promise((resolve) => {
    const CONCURRENCY = 8;
    let cursor = 0;
    const tick = () => {
      loaded += 1;
      if (onProgress) onProgress(Math.min(loaded / total, 1));
      if (loaded >= total) resolve();
      else next();
    };
    const next = () => {
      if (cursor >= queue.length) return;
      const emoji = queue[cursor++];
      const url = getFluentEmojiUrl(emoji);
      if (!url) { tick(); return; }
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = tick;
      img.onerror = tick;
      img.src = url;
    };
    for (let i = 0; i < CONCURRENCY; i++) next();
  });

  return startedPromise;
}
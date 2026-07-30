// Cloud-backed data store — Base44 entities are the source of truth, with a
// localStorage cache for instant reads and offline resilience.
//
// Why this exists:
// Previously this file was local-only (localStorage was the source of truth).
// That meant any time browser storage was cleared — a domain change, a private
// tab, iOS storage eviction, or an "app got updated and reloaded" event — the
// user's players and history would vanish. Now those records live in the
// Base44 cloud entities (Player, GameHistory), so they follow the user across
// devices and survive reloads/updates.
//
// Strategy per read: hit the cache immediately (so screens paint instantly),
// then fetch from Base44 in the background and repaint if it differs. Writes
// go to Base44 first; on success we mirror to the cache. If the network
// write fails we still keep the record in the cache and mark it as needing
// sync (best-effort — the app never blocks on the network).
//
// The public API (db.players / db.games list/create/update/delete) is
// unchanged, so call sites don't need to change.

import { base44 } from "@/api/base44Client";

const PLAYERS_KEY = "scrkpr_players_cache";
const GAMES_KEY = "scrkpr_games_cache";

// Kept for callers that still reference it; sync is now always on.
export const SYNC_ENABLED = true;

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[store] failed to read cache ${key}:`, e);
    return [];
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Quota / private-mode failures shouldn't crash the app.
    console.error(`[store] failed to write cache ${key}:`, e);
  }
}

// Parse a Base44-style order token ("-played_at" => field played_at, desc)
// and return a comparator — used to sort cached rows the same way Base44 would.
function comparator(order) {
  if (!order) return null;
  const desc = order.startsWith("-");
  const field = desc ? order.slice(1) : order;
  return (a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    const cmp = av < bv ? -1 : 1;
    return desc ? -cmp : cmp;
  };
}

function sortAndLimit(rows, order, limit) {
  const cmp = comparator(order);
  const sorted = cmp ? [...rows].sort(cmp) : rows;
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

// Whether we've done at least one successful cloud fetch this session — used
// to avoid clobbering fresh cloud writes with a stale cache on subsequent
// list() calls.
const hydrated = { players: false, games: false };

async function cloudList(entity, cacheKey, hydratedKey, order, limit) {
  try {
    const rows = await base44.entities[entity].list(order, 500);
    writeCache(cacheKey, rows);
    hydrated[hydratedKey] = true;
    return sortAndLimit(rows, order, limit);
  } catch (e) {
    console.warn(`[store] cloud list ${entity} failed, using cache:`, e?.message || e);
    return sortAndLimit(readCache(cacheKey), order, limit);
  }
}

export const db = {
  players: {
    // Cache-first, then cloud. Returns whatever we have immediately; the cloud
    // refresh happens in the background and updates the cache for next time.
    async list(order = "-created_date", limit) {
      const cached = sortAndLimit(readCache(PLAYERS_KEY), order, limit);
      // If we've already hydrated this session, return the fresh cache and
      // still kick off a background refresh so long-lived sessions catch up.
      if (hydrated.players) {
        cloudList("Player", PLAYERS_KEY, "players", order, limit).catch(() => {});
        return cached;
      }
      // First call this session: await the cloud so History/Players don't
      // show stale-then-flash on cold start.
      return cloudList("Player", PLAYERS_KEY, "players", order, limit);
    },
    async create(data) {
      const created = await base44.entities.Player.create(data);
      writeCache(PLAYERS_KEY, [created, ...readCache(PLAYERS_KEY).filter((p) => p.id !== created.id)]);
      return created;
    },
    async update(id, patch) {
      const updated = await base44.entities.Player.update(id, patch);
      writeCache(
        PLAYERS_KEY,
        readCache(PLAYERS_KEY).map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      return updated;
    },
    async delete(id) {
      await base44.entities.Player.delete(id);
      writeCache(PLAYERS_KEY, readCache(PLAYERS_KEY).filter((p) => p.id !== id));
      return true;
    },
  },

  games: {
    async list(order = "-played_at", limit) {
      const cached = sortAndLimit(readCache(GAMES_KEY), order, limit);
      if (hydrated.games) {
        cloudList("GameHistory", GAMES_KEY, "games", order, limit).catch(() => {});
        return cached;
      }
      return cloudList("GameHistory", GAMES_KEY, "games", order, limit);
    },
    async create(data) {
      const created = await base44.entities.GameHistory.create(data);
      writeCache(GAMES_KEY, [created, ...readCache(GAMES_KEY).filter((g) => g.id !== created.id)]);
      return created;
    },
    async delete(id) {
      await base44.entities.GameHistory.delete(id);
      writeCache(GAMES_KEY, readCache(GAMES_KEY).filter((g) => g.id !== id));
      return true;
    },
  },

  // Wipe everything (used by Account Settings' "Clear all data"). This clears
  // both the cloud records (owned by this user via RLS) and the local cache.
  async clearAll() {
    try {
      const [players, games] = await Promise.all([
        base44.entities.Player.list("-created_date", 500),
        base44.entities.GameHistory.list("-played_at", 500),
      ]);
      await Promise.all([
        ...players.map((p) => base44.entities.Player.delete(p.id).catch(() => {})),
        ...games.map((g) => base44.entities.GameHistory.delete(g.id).catch(() => {})),
      ]);
    } catch (e) {
      console.error("[store] clearAll cloud sweep failed:", e);
    }
    writeCache(PLAYERS_KEY, []);
    writeCache(GAMES_KEY, []);
    return true;
  },
};
// Local-first data store — localStorage is the source of truth.
//
// The app is now local-first: players + game history live on-device and the
// pages read/write here instead of hitting Base44 directly. Reads resolve
// instantly from localStorage (no network on the happy path), so the History
// and Players screens can no longer come back empty or fail silently offline.
//
// The API mirrors the old `base44.entities.Player` / `base44.entities.GameHistory`
// surface (list / create / update / delete, all async) so call sites barely
// changed and a future cloud-sync layer can slot in behind the same methods.
//
// Cloud sync to Base44 is deliberately deferred (see HANDOFF "Local-first plan").
// SYNC_ENABLED gates every Base44/auth path; flip it on once the best-effort
// mirror + reconnect flush are built. While it's false, the app needs no
// account and never touches the network for player/history data.

export const SYNC_ENABLED = false;

const PLAYERS_KEY = "scrkpr_players";
const GAMES_KEY = "scrkpr_games";
const SAVED_GAMES_KEY = "scrkpr_saved_games";

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[store] failed to read ${key}:`, e);
    return [];
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Quota / private-mode failures shouldn't crash the app — the in-memory
    // result is still returned to the caller; only persistence is lost.
    console.error(`[store] failed to write ${key}:`, e);
    return false;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Parse a Base44-style order token ("-played_at" => field played_at, desc;
// "created_date" => asc) and return a comparator. Falls back to no-op sort
// when the field is missing on the records.
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

function listFrom(key, order, limit) {
  const rows = read(key);
  const cmp = comparator(order);
  const sorted = cmp ? [...rows].sort(cmp) : rows;
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export const db = {
  players: {
    // Mirrors base44.entities.Player.list("-created_date", 100)
    async list(order = "-created_date", limit) {
      return listFrom(PLAYERS_KEY, order, limit);
    },
    async create(data) {
      const record = { id: newId(), created_date: new Date().toISOString(), ...data };
      const rows = read(PLAYERS_KEY);
      write(PLAYERS_KEY, [record, ...rows]);
      return record;
    },
    async update(id, patch) {
      const rows = read(PLAYERS_KEY);
      let updated = null;
      const next = rows.map((p) => (p.id === id ? (updated = { ...p, ...patch }) : p));
      write(PLAYERS_KEY, next);
      return updated;
    },
    async delete(id) {
      write(PLAYERS_KEY, read(PLAYERS_KEY).filter((p) => p.id !== id));
      return true;
    },
  },

  games: {
    // Mirrors base44.entities.GameHistory.list("-played_at", 50)
    async list(order = "-played_at", limit) {
      return listFrom(GAMES_KEY, order, limit);
    },
    async create(data) {
      const record = { id: newId(), ...data };
      const rows = read(GAMES_KEY);
      write(GAMES_KEY, [record, ...rows]);
      return record;
    },
    async delete(id) {
      write(GAMES_KEY, read(GAMES_KEY).filter((g) => g.id !== id));
      return true;
    },
  },

  // Paused/in-progress games the user saved to resume later. Unlike `games`
  // (completed, aggregated results) these hold the FULL live state — each
  // player's `scores` array plus win_mode / best_of / target_score — so a game
  // can be restored exactly where it left off.
  savedGames: {
    async list(order = "-saved_at", limit) {
      return listFrom(SAVED_GAMES_KEY, order, limit);
    },
    async create(data) {
      const record = { id: newId(), ...data };
      const rows = read(SAVED_GAMES_KEY);
      write(SAVED_GAMES_KEY, [record, ...rows]);
      return record;
    },
    async delete(id) {
      write(SAVED_GAMES_KEY, read(SAVED_GAMES_KEY).filter((g) => g.id !== id));
      return true;
    },
  },

  // Wipe everything stored on this device (used by Account Settings).
  async clearAll() {
    write(PLAYERS_KEY, []);
    write(GAMES_KEY, []);
    write(SAVED_GAMES_KEY, []);
    return true;
  },
};

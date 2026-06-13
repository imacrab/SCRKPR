# SCRKPR — Session Handoff

> Context doc for continuing work on a new machine / new Claude session.
> Last updated: June 13, 2026

## What this project is

SCRKPR is a scorekeeping app (React 18 + Vite + Tailwind + framer-motion, shadcn/ui components) built on **Base44** (hosted backend: auth, `Player` and `GameHistory` entities). Repo: `imacrab/SCRKPR` on GitHub. The Base44 GitHub integration syncs the repo with the Base44 Builder; publishing happens from Base44. Goal: polish the app for an eventual App Store release (will need a native wrapper, e.g. Capacitor — not started).

## Local setup

```bash
npm install
# create .env.local (gitignored — must be recreated on each machine):
# VITE_BASE44_APP_ID=69ea763700078809357a164a
# VITE_BASE44_APP_BASE_URL=https://scrkpr.base44.app
npm run dev      # Vite dev server, usually :5173
npm run lint     # eslint --quiet (clean as of last commit)
npm run build    # passes as of last commit
```

Without `.env.local`, backend calls fail silently (e.g. adding a player does nothing) and the build logs `[base44] Proxy not enabled`.

> Sandbox/CI note: headless Chromium on arm64 may need `@rollup/rollup-linux-arm64-gnu` and a stub `libXdamage.so.1`; Vite needs file-delete permission for its `.vite` cache. Real-device testing is still required for touch drag — headless mouse events don't reproduce dnd's touch timing (see Open items).

## Branches

- `main` — untouched Base44-synced code.
- `standardize-design-tokens` — design-token standardization (details below).
- `delight-pass` — branched off the token branch; all subsequent feature/polish work. **This is the active branch.**

## What was done

### 1. Design tokens (`standardize-design-tokens`)

- `src/lib/motion.js` — single source of truth for animation: `SPRING_SHEET` (400/35, sheets/modals), `SPRING_SNAPPY` (500/25, in-layout UI), `SPRING_POP` (800/8/0.5, bouncy emphasis), `EASE_STANDARD [0.4,0,0.2,1]`, `DUR_FAST .15 / DUR_MEDIUM .25 / DUR_PAGE .4`, presets `TRANSITION_FADE/PANEL/PAGE`. All inline spring/duration values across the app were replaced with these.
- `src/lib/colors.js` — `ACCENT_BLUE #2DC5F8`, `ACCENT_RED #FF3A3A`, `INK #111111`, `PLAYER_COLORS` (16-color rainbow, also used for confetti).
- Tailwind tokens in `tailwind.config.js`: `rounded-sheet` (44px), `min-h-touch` (44px), `backdrop-blur-xs` (4px). Replaced all arbitrary `[44px]`/`[4px]` values.
- Hard-coded `#FF3A3A`/`#2DC5F8` inline styles → `accent-red`/`accent-blue` Tailwind classes.
- Consolidated duplicate edit-player modals: deleted `EditPlayerModal.jsx`; everything uses `PlayerEditModal` (its delete button only renders when an `onDelete` prop is passed).

### 2. Delight pass (`delight-pass`)

- **Leader crown 👑** — `ScoreBoard` computes `leaderId` (tie- and low-mode-aware); `PlayerColumn` renders a crown with shared `layoutId="leader-crown"` so it *flies between cards* when the lead changes.
- **End Game modal** — winner's-own-emoji confetti finale (guarded `confetti.shapeFromText`), trophy pop + wiggle, standings stagger in with 🥇🥈🥉 medals.
- **Player cards stagger on load** — rise + settle, 70ms apart; entrance delay scoped to y/scale/opacity so layout reorders stay instant.
- **Streak badge** — Fluent 🔥 emoji (was lucide Flame), continuous flicker.
- **Bottom nav** — springy active pill (`layoutId="nav-active-pill"`), icon lift, tap squish.
- Score digits scale-pop on change; emoji picker selection wiggle; score-history rows cascade.

### 3. Features

- **Players page bulk delete** — "Select" header toggle OR long-press a card (0.5s) to enter select mode with that card selected. Check badges, floating red "Delete N players" pill (takes the nav's spot — nav slides down during select mode), count-aware confirm sheet, optimistic delete via `Promise.allSettled`.
- **New-player auto-fill** — `PlayerEditModal` auto-picks a random *unused* color and emoji (`usedColors`/`usedEmojis` props passed from all 4 call sites; falls back to full pool if everything is taken).
- **History (Past Rounds) page** — Games/Stats segmented tabs (springy pill) replace the old stats dropdown. Latest game gets a hero card: winner-color gradient + border, big emoji avatar, display-font name, oversized ghosted winner emoji, medal podium with per-player emoji chips. Older games sit under an "Earlier" divider. Stats tab is a full panel with emoji avatars, 👑 on the win leader, staggered rows.

### 4. Session June 13 — polish, de-Base44 assets, reorder rewrite

- **Local logo** — bundled `src/assets/SCRKPR_{dark,light}_mode.png` and import them in `PlayerSetup`/`ScoreBoard` instead of loading from media.base44.com. App is forced dark (`main.jsx`), so both currently use the dark (white) wordmark. `index.html` title is "SCRKPR" with a local `/favicon.png`; added `public/manifest.json`.
- **`FluentEmoji` fallback fix** — now renders a real unicode `<span>` when the Fluent CDN asset fails (previously it just hid the broken `<img>`, so offline devices lost all emoji).
- **Score slide unclipped** (`PlayerColumn` `AnimatedTotal`) — the changing total is no longer clipped to its little number box; old digit slides up + fades, new rises from below, clipped at the player-card level.
- **End Game button redesign** — ink fill (app background) inside an animated flowing-gradient 4px stroke; the flag does the streak-style scale/wiggle pop. (Earlier gradient-fill + sheen + halo + flag-wave was too busy.)
- **Add Player fade-in** — on the setup screen it fades in only after the card stagger finishes.
- **Persistent logo shared-element transition** — a single logo hoisted to `ScoreKeeper` (outside the page `AnimatePresence`) glides/resizes between the big centered home slot and the small top-left game slot. Each page renders an invisible `[data-logo-anchor]`; the floating logo measures it (re-measured on `onAnimationComplete` so it lands after the page-enter scale settles) and springs to match. The in-page logos are `opacity:0` but keep layout + the tap-to-End-Game target (floating logo is `pointer-events:none`).
- **Modal z-index via portal** — `BottomSheetModal` now `createPortal`s to `document.body`, escaping the transformed page's stacking context so the backdrop sits above the persistent logo (the logo dims under it instead of painting over the modal). This supersedes the old "hide the logo when a modal opens" workaround.
- **Players select mode = "edit mode" frame** — a 4px accent-blue border (`#2DC5F8`) with inner glow fades in around the whole screen while selecting (`Players.jsx`, gated on `selectMode`). Swap to `accent-red` if you want it to match the delete pill.
- **Single-list player reorder + manual FLIP** (the big one — see Conventions): replaced the two-list (selected Droppable + separate unselected list) with ONE `Droppable`. Selected players sit on top and are re-orderable; unselected sit below as `isDragDisabled` `Draggable`s. This killed the toggle remount AND a drop "snap". Toggling a player now *flies* it between segments; dnd owns drag/drop natively.

### 5. Bug fixes worth knowing about

- **Stacking-context trap**: page wrappers are transformed (`motion.div` page transitions), so fixed overlays at app level paint over modals regardless of modal z-index. The tab-bar gradient fade in `ScoreKeeper.jsx` now hides whenever `navHidden` is true (same signal pages send via `onModalChange` when any modal opens). If you add fixed overlays, follow this pattern.
- **`BottomSheetModal`** (shared sheet shell): scrollable body has bottom padding + footer gets `border-t` so content doesn't collide with footer buttons; header `border-b` fades in once the body is scrolled (matches footer treatment).
- `.env.local` missing = silent backend failures (see Local setup).

## Conventions

- Import animation values from `@/lib/motion` and colors from `@/lib/colors` — no inline springs/durations/hex.
- Modals use `BottomSheetModal` (which portals to `document.body`); player editing uses `PlayerEditModal` everywhere.
- Pages signal modal-open via `onModalChange` so `ScoreKeeper` hides nav + gradient.
- Emojis render through `FluentEmoji` (Microsoft Fluent 3D via CDN, unicode `<span>` fallback).
- The SCRKPR logo is local (`@/assets/SCRKPR_dark_mode.png`) — never re-add the media.base44.com URL.
- **Error handling:** `src/components/ErrorBoundary.jsx` wraps the app (in `App.jsx`, *outside* the transformed page `motion.div` so its fixed fallback is viewport-relative). Any page crash shows a calm "We had a little hiccup / your games are still saved" screen with a "Back to Home" button that hard-reloads `/`. Prefer to also fail-soft at the source (e.g. `safeFormat` in `History.jsx` guards bad dates) so the boundary stays a last resort. Game data persists in localStorage + Base44, so a reload is safe.

### Player list reorder/animation architecture (PlayerSetup) — read before touching

The setup player list is the trickiest component. Hard-won rules:

- **One `Droppable`, not two.** All players in a single list: selected (re-orderable) first, then unselected as `isDragDisabled` `Draggable`s. `handleDragEnd` reorders within the selected segment and clamps the destination into it. This avoids remounting a card when it's toggled (so it can animate between segments).
- **Each row is three nested elements, one transform concern each — do NOT collapse them:**
  1. outer plain `div[data-row-id]` — manual entrance + FLIP-on-reorder (set directly via `useLayoutEffect`, no framer).
  2. the dnd node (`innerRef` + `draggableProps` + `dragHandleProps`) — **pure**, no transform/transition overrides. Overriding this fights dnd's drop animation and causes the "snap".
  3. inner card `div` — the cinch/tilt/tap squish + all visuals.
- **FLIP is manual** (First-Last-Invert-Play with synchronous `transform` set before paint), keyed by player id in viewport coords. It runs ONLY for selection toggles; it is skipped during a drag and through a post-drop cooldown (`isDraggingRef` / `dropCooldownRef`) so dnd owns drag/drop entirely.
- **Do NOT use framer `layout`/`layoutId` on these rows.** It deadlocks the page-level `AnimatePresence mode="wait"` exit and breaks navigation to the scoreboard (verified across blur/scale/opacity variants). The persistent-logo and crown still use `layoutId` because they're not inside that exiting list.
- A separate FLIP *wrapper* element inside the Draggable breaks dnd's drag *pickup* (extra nesting throws off its measurements) — that's why the FLIP transform lives on the row's existing outer div, with the dnd node as a direct child.

## Open items

- [ ] **Device-test the player-list drag + toggle (highest priority).** The single-list reorder, drag cinch, and toggle fly were all verified in headless Chromium (mouse), but touch timing differs and earlier drag "snaps" only showed on-device. Feel it on a real phone before trusting it; a screen recording is the fastest way to debug if something's off.
- [ ] **Go local-first / migrate off Base44** (the bigger thread) — see the "Local-first plan" section below for the full shape. Everything in `src/` that still references base44 is the backend SDK itself (auth, `Player`/`GameHistory` entities in `src/api/base44Client.js`, `AuthContext`, the pages). Assets/branding are already de-Base44'd.
- [ ] **Async/network error handling** — the `ErrorBoundary` only catches *render* crashes, not rejected promises. `base44.entities.*` reads/writes are currently unguarded and fail silently offline. Largely subsumed by the local-first plan (local becomes source of truth, sync is best-effort), but until then a caught-promise + toast pass would help.
- [ ] App Store wrapper (Capacitor or similar), icons, splash screens — not started. Generate a proper app icon (currently `public/favicon.png` is derived from the wordmark).
- [ ] Open PRs / merge strategy for the branches (Base44 syncs from the repo).
- [ ] Optional polish offered but not done: extend stagger-on-load to History cards; "Select all" in Players select mode; decide blue vs red for the edit-mode frame.
- [x] ~~Visual pass over both branches.~~ Done June 12.
- [x] ~~`FluentEmoji` unicode fallback.~~ Fixed (see §4).
- [x] ~~Bundle the logo locally / de-Base44 assets.~~ Done (see §4).
- [x] ~~Rotate the Base44 API key.~~ Rotated June 12, 2026.

## Verification harness (for the next session)

Reusable headless test scripts live in the scratch outputs dir (not committed): mocked Base44 routes + Playwright probes for navigation, the toggle fly trajectory, drag pickup/drop frame-diffs, and the logo transition. Pattern: mock `**/api/**`, drive the UI, screencast via CDP, then diff frames or track `getBoundingClientRect`. Recreate as needed — they're how the animation work was validated without a backend.

## Local-first plan (proposed — not yet built)

> Captured from a design discussion. This is the umbrella that the "migrate off
> Base44", "async error handling", and "offline banner" items all live under.
> Build it as a deliberate phase, not a quick win.

### The problem with today's architecture

The app is **backend-first**, not local-first — the opposite of the MVP we want:

- In-progress game state → already local (`scorekeeper_game_state` in localStorage, `ScoreKeeper.jsx`). Good.
- **Saved players** (`Player`) and **game history** (`GameHistory`) → read from / written to Base44 as the source of truth (`Players.jsx`, `History.jsx`, `ScoreKeeper.handleStartGame`/end-game). So offline, those screens come back empty or fail silently. Adding a player / saving a finished game writes straight to the backend.

Because of this, a "you're offline, keep playing, we'll sync later" banner would currently be **dishonest** — the History page is genuinely broken offline, not gracefully degraded. The banner is the *reward* for going local-first, not the first step.

### Target architecture

Local is the source of truth; the backend is an optional mirror.

1. **Persist players + history on-device** as the primary store. localStorage is fine for MVP (small JSON); reach for IndexedDB (e.g. via `idb`) only if data grows or we want richer querying. Pages read from local first and render instantly — no network on the happy path.
2. **Sync layer (only when signed in + online).** A best-effort background mirror to the backend for the *future* cross-device story: last-write-wins or simple per-record timestamps to start; no fancy CRDTs needed for a scorekeeper. Writes go to local immediately, enqueue for sync; a flush runs on reconnect.
3. **Calm status indicator, not an alarm.** Once local-first, "offline" is barely an error. A quiet, low-contrast pill like "Saved on this device · will sync when you're back" — matching the app's tone — beats a worried "You're out of service!" Detect with `navigator.onLine` + `online`/`offline` events for MVP (note: `navigator.onLine` only knows the interface is up, not real reachability — good enough for the indicator; trust actual request success/failure for sync).

### Open question: defer auth for v1?

If it's local-first, login may not be needed at all for the MVP — someone opens SCRKPR and just keeps score, no account, no friction. Auth only earns its place once there's cross-device sync to protect. Deferring it shrinks the Base44 surface area a lot and removes the `AuthProvider`/`auth_required` paths from the critical path. Decision pending — but leaning yes for MVP.

### Rough sequence

1. Introduce a local data module (`src/lib/store.js` or similar) — CRUD for players + history against localStorage/IndexedDB, same shape the pages already expect.
2. Repoint `Players.jsx`, `History.jsx`, and the game save/end flow to that module (drop the direct `base44.entities.*` calls on the read/write path).
3. Decide on auth (defer vs keep). If deferring, gate the Base44/auth code behind a "sync enabled" flag.
4. Add the sync layer + reconnect flush (only if/when cloud sync is wanted).
5. Add the calm offline/sync-status indicator — now truthful.
6. Migration: on first local-first launch for an existing user, pull their Base44 players/history down into the local store once.

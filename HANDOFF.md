# SCRKPR — Session Handoff

> Context doc for continuing work on a new machine / new Claude session.
> Last updated: June 12, 2026

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

### 4. Bug fixes worth knowing about

- **Stacking-context trap**: page wrappers are transformed (`motion.div` page transitions), so fixed overlays at app level paint over modals regardless of modal z-index. The tab-bar gradient fade in `ScoreKeeper.jsx` now hides whenever `navHidden` is true (same signal pages send via `onModalChange` when any modal opens). If you add fixed overlays, follow this pattern.
- **`BottomSheetModal`** (shared sheet shell): scrollable body has bottom padding + footer gets `border-t` so content doesn't collide with footer buttons; header `border-b` fades in once the body is scrolled (matches footer treatment).
- `.env.local` missing = silent backend failures (see Local setup).

## Conventions

- Import animation values from `@/lib/motion` and colors from `@/lib/colors` — no inline springs/durations/hex.
- Modals use `BottomSheetModal`; player editing uses `PlayerEditModal` everywhere.
- Pages signal modal-open via `onModalChange` so `ScoreKeeper` hides nav + gradient.
- Emojis render through `FluentEmoji` (Microsoft Fluent 3D via CDN, unicode fallback).

## Open items

- [x] ~~Visual pass over both branches in the browser.~~ Done June 12, 2026 on `delight-pass` via headless Chromium + mocked Base44 API (sandbox can't reach the backend). All 11 key screens verified against this doc: setup, selection, scoreboard, score input, end-game modal (confetti ✓), Players + select mode + delete pill, History hero card + Games/Stats tabs, Account. Found & fixed: `FluentEmoji` claimed a unicode fallback but only hid the broken `<img>` — offline/CDN-blocked devices lost ALL emoji (avatars, leader crown, medals, winner). Now renders a real unicode `<span>` fallback. Remaining nit: the SCRKPR logo loads from media.base44.com, so it's a broken-image icon offline — consider bundling it locally before the App Store wrapper.
- [ ] Possibly extend stagger-on-load to Players list and History cards (offered, not requested).
- [ ] Possibly "Select all" in Players select mode (offered, not requested).
- [ ] App Store wrapper (Capacitor or similar), icons, splash screens — not started.
- [ ] Open PRs / merge strategy for the two branches (Base44 syncs from the repo).
- [x] ~~The Base44 API key was pasted in a chat once — rotate it in Base44 dashboard.~~ Rotated June 12, 2026.

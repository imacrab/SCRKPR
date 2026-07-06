# SCRKPR — Session Handoff

> Context doc for continuing work on a new machine / new Claude session.
> Last updated: July 6, 2026 (modal unification + white modal text + Reset slide-down — see §16)

## TL;DR (start here)

- **What:** SCRKPR — a delightful **local-first** scorekeeping app for in-person game night. React 18 + Vite + Tailwind + framer-motion. Data lives on-device (localStorage via `src/lib/store.js`); Base44 backend is dormant behind `SYNC_ENABLED = false`. Repo `imacrab/SCRKPR`, app is **forced dark**.
- **Run it:** `npm install` → `npm run dev` (works fully offline, no `.env`). `npm run lint` and `npm run build` both pass. Full app is feature-complete and green.
- **Where we are:** UI/UX is essentially done through §16. App icon **resolved** (coral circles, §14). Currently on branch **`fix-clean-house`** (cut from `main`, which has everything merged).
- **What's next (the actual blockers):** ship to the **iOS App Store** — all Mac-side: (1) finish the Xcode/submission runbook in `CAPACITOR_iOS.md` (set the `.icon`, sign w/ team `8RJXUWMLNF`, iPhone-only, upload) + paste `APP_STORE_CONNECT.md`; (2) **real-iPhone device test** (drag/FLIP/safe-area only verified headlessly); (3) `npm audit fix`; (4) phase-2: drop `@base44/sdk` from the bundle. See **Open items**.
- **Conventions that bite if ignored:** one modal only — `BottomSheetModal` (§16); animation values from `@/lib/motion`, colors from `@/lib/colors` (no inline hex/springs); emojis via `FluentEmoji`; logo is `@/assets/scrkpr-logo.svg`. The player-list reorder in `PlayerSetup` is a minefield — read its architecture note before touching. Preview/dev animations can look frozen in a backgrounded browser tab (rAF pauses) — an environmental artifact, not a bug.
- **Read next:** "Current state" snapshot below for the fuller picture, then §16 → §14 for the most recent work; **Open items** for the punch list.

## What this project is

SCRKPR is a delightful, **local-first** scorekeeping app for in-person game night (React 18 + Vite + Tailwind + framer-motion, shadcn/ui). Repo: `imacrab/SCRKPR` on GitHub. Players, scores, and history live **on-device** (localStorage via `src/lib/store.js`) — **no account, no network on the happy path.** Base44 (the original hosted backend) is fully **dormant behind `SYNC_ENABLED = false`** in `lib/store.js`: the SDK/auth are stubbed (`src/api/base44Client.js`) so the app boots offline with zero network calls. Goal: ship to the **iOS App Store** via a Capacitor wrapper — scaffolded; see **`CAPACITOR_iOS.md`** (Mac runbook) + **`APP_STORE_CONNECT.md`** (submission kit, fully filled) + **`APP_STORE_READINESS.md`**.

## Local setup

```bash
npm install
npm run dev      # Vite dev server, usually :5173; may auto-pick :5174 if busy — works fully offline, no .env needed
npm run lint     # eslint --quiet (clean)
npm run build    # vite build (passes)
npm run cap:sync # vite build && cap sync   (iOS)
```

- **No `.env.local` needed** — the app is local-first; Base44 is off. (Old Base44 key rotated; nothing sensitive is committed — repo is public.)
- **npm optional-dep gotcha:** install/uninstall cycles can drop `@rollup/rollup-linux-arm64-gnu` (npm bug #4828) → `vite build` fails with "Cannot find module @rollup/rollup-linux-arm64-gnu". In-sandbox fix: `npm install @rollup/rollup-linux-arm64-gnu --no-save` (do NOT add to package.json — it's platform-specific; a fresh `npm install` on macOS pulls the darwin binary).
- **Tests:** scratch node/jsdom tests are NOT committed, so they don't survive a fresh session — recreate as needed. June 27 reused an 18-check logic suite (store CRUD/ordering/limit/merge/clearAll/corrupt-JSON + mode metadata incl. Gin/Swish + round/accumulate/Swish-low-wins) via a `localStorage` shim importing the real `store.js`/`gameModes.js`. Capacitor code-splits the build, so the old `render*` bundle-eval tests no longer run; rely on logic unit tests + real-device for UI.

## Branches

- `main` — **the release line;** has everything through §16 (logo/icon PR #21, modal updates, and the modal-unification + Reset slide-down PR #22 all merged). Base44 still syncs from the repo (confirm the Builder/publish flow tolerates the stubbed SDK before relying on it).
- `fix-clean-house` — current working branch (cut from `main` after PR #22; where new work continues).
- Historical (merged): `delight-pass`, `logo-icon-pass`, `fix-odd-ends`, `standardize-design-tokens` (original token branch, §1).

## Current state (July 5) — quick snapshot

- **Scoring model:** tap a player → number pad → enter the round (no ± buttons). A "round" = the lowest score-count across players. A player who's logged the current round shows a green ✅ (emoji morphs to check); **re-tapping accumulates onto that round's entry** (+2 then +4 = +6), and the round only advances once everyone's logged — no skip-ahead. Tapping the small "(+X)" subtext replaces/corrects that entry.
- **Game modes:** generic **High / Low / Best Of**, with an optional **target** on High/Low (reach it → game auto-ends). Covers Gin (High+100) and "Swish" (Low+500). Sort follows the mode.
- **Scoreboard** has a History-style segmented pill: **Scoreboard ↔ Rounds** (the per-round table; appears once a round is logged, hidden in Best Of).
- **Last-10% polish pass is active:** bottom sheets animate both in and out (including backdrop blur), the slide-to-end-game control tucks away behind score/end-game modals, and tab/nav highlights now use calmer bounded ease-in-out motion instead of bouncy shared-layout springs.
- **FTUE, regulars (favorites), End Game hero, History** all shipped (see sections below).
- **App Store:** Capacitor v8 scaffolded (`capacitor.config.json`, appId `com.illudcrab.scrkpr`, Team `8RJXUWMLNF`); `ios/` project generated on the Mac. Privacy policy hosted at a public gist. **Icon RESOLVED (July 5):** coral tile + four white circles (one hollow) — Icon Composer bundle at `assets/Icons/SCRKPR.icon` + SVG variants in `assets/Icons/SVG/`; 1024² raster wired into the Xcode asset catalog. See §14.
- **Codebase (post June-27 cleanup):** dependencies trimmed **53 → 20** (removed dead `GameMenuModal` + the unused shadcn `ui/` library — only `button`/`input`/`toast`/`toaster`/`use-toast` remain — and all orphaned Radix/`sonner`/`next-themes`/`react-hook-form` deps). Lint/build/18-test/dev-server all green. `npm audit`: 16 non-breaking advisories outstanding (build-time + dormant base44-SDK; only `react-router` ships+runs). See §13.

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
- **Bottom nav** — active pill now uses a persistent transform-based ease-in-out glide (no shared-layout spring bounce); icon lift/tap feedback is softened.
- Score digits scale-pop on change; emoji picker selection wiggle; score-history rows cascade.

### 3. Features

- **Players page bulk delete** — "Select" header toggle OR long-press a card (0.5s) to enter select mode with that card selected. Check badges, floating red "Delete N players" pill (takes the nav's spot — nav slides down during select mode), count-aware confirm sheet, optimistic delete via `Promise.allSettled`.
- **New-player auto-fill** — `PlayerEditModal` auto-picks a random *unused* color and emoji (`usedColors`/`usedEmojis` props passed from all 4 call sites; falls back to full pool if everything is taken).
- **History (Past Rounds) page** — Games/Stats segmented tabs replace the old stats dropdown. The tab highlight now elongates then constricts with bounded ease-in-out motion (no bounce/overshoot). Latest game gets a hero card: winner-color gradient + border, big emoji avatar, display-font name, oversized ghosted winner emoji, medal podium with per-player emoji chips. Older games sit under an "Earlier" divider. Stats tab is a full panel with emoji avatars, 👑 on the win leader, staggered rows.

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

### 6. Session June 13 (pt. 2) — local-first migration (phase 1)

Made the app **local-first**: device storage is now the source of truth for players + history; Base44 is deferred behind a single flag. The app loads instantly, needs no account, and makes **zero network calls** offline (verified).

- **`src/lib/store.js`** (new) — localStorage-backed CRUD for players + games, exposed as `db.players.{list,create,update,delete}` and `db.games.{list,create,delete}` plus `db.clearAll()`. The method/argument shape mirrors the old `base44.entities.*` surface (e.g. `list("-created_date", 100)`), so call sites barely changed and a future sync layer can slot in behind the same methods. Reads are resilient (corrupt JSON → `[]`); writes fail soft (quota/private-mode logs, doesn't throw). Exports **`SYNC_ENABLED = false`** — the master switch for all Base44/auth/cloud paths.
- **Repointed every entity call** off Base44 onto `db`: `Players.jsx`, `History.jsx` (delete/clearAll already had try/catch), `ScoreKeeper.jsx` (end-game save, now wrapped so a save failure never blocks ending the game), `ScoreBoard.jsx` (streak fetch, added `.catch`), and **`PlayerSetup.jsx`** (saved-player list + add). No `base44.entities.*` remain in code.
- **Auth deferred (v1).** `AuthContext` short-circuits its boot-time app-state/`auth.me` network checks when `!SYNC_ENABLED` (resolves to unauthenticated, no spinner, no error). `base44Client.js` no longer instantiates the real SDK when sync is off — it returns a tiny **stub** (`auth.me` rejects, `logout`/`redirect` no-op). This is what removed the last boot-time network call (the SDK was firing `auth.me` on instantiation).
- **`AccountSettings.jsx` reworked** for local data: titled "Settings"; a calm "**Saved on this device**" status card (the honest local-first indicator the plan called for); "Delete Account" → "**Clear All Data**" wired to `db.clearAll()`; the Sign Out card only renders when `SYNC_ENABLED`.
- **Async error handling** (the other open item) is largely **subsumed** by this: local reads/writes don't hit the network, so the silent-offline-failure problem is gone on the happy path. Remaining promise rejections (e.g. local quota) are caught + logged.
- **Polish items** from the old open list were already shipped before this session: History stagger-on-load and Players "Select all" both exist in code; edit-mode frame **kept blue** (`#2DC5F8`) per decision.

**Not done (next phases of the plan):** the actual Base44 **sync layer** (write-through queue + reconnect flush, last-write-wins) and the **one-time migration** that pulls an existing user's Base44 players/history into the local store on first local-first launch. Both gated to build behind `SYNC_ENABLED`. A live online/offline pill is moot while local-only (offline isn't an error state); revisit when sync lands.

**Verified this session (no backend):** `npm run lint` clean; `vite build` exit 0 (build to a temp `--outDir`; building into the repo's own `dist/` still hits the EPERM unlink quirk noted below); store unit tests (CRUD/ordering/limit/clearAll/corrupt-JSON); and a jsdom render of the production bundle with **all network blocked** — app mounts the home screen offline with 0 network calls, and a seeded `/history` renders a saved game ("Winner Adrian 99 pts"). Test scripts are in the scratch outputs dir (not committed): `store.test.mjs`, `render.test.mjs`, `render-history.test.mjs`.

### 7. Session June 13 (pt. 3) — FTUE first draft

First-time user experience, shown once on first launch (the natural moment now that local-first means no login wall). **First draft — built to be refined.**

- **`src/lib/onboarding.js`** (new) — `hasOnboarded()` / `setOnboarded()` / `resetOnboarding()`, keyed `scrkpr_onboarded` with an `ONBOARDING_VERSION` (bump to re-show after a redesign). Exposes `window.scrkprReplayIntro()` for console replay during iteration.
- **`src/components/Onboarding.jsx`** (new) — full-screen, on-brand welcome. Three swipeable slides (logo welcome → "Set up your players" with app-style player chips → "Just tap to keep score" with a mini scoreboard + leader 👑), animated progress dots, Skip, and a primary CTA (`Next` → `Start scoring`). Uses the motion tokens, `FluentEmoji`, accent-blue, Syne/Geist. Drag-to-swipe via framer `drag="x"` with an 80px threshold.
- **Wired in `App.jsx`** — gated above the routed app inside the `ErrorBoundary`, in its own `AnimatePresence`; `useState(() => !hasOnboarded())`. On finish it sets the flag and animates out (fade + blur + slight scale) revealing the home screen.
- **Settings → "Replay Welcome"** row resets the flag and reloads `/` so the flow can be cycled.
- Verified: lint clean, build exit 0, jsdom render — FTUE shows on first launch (0 network), is skipped once onboarded, returning user lands on home.

**Persistent header + logo morph:** the SCRKPR logo lives in a top header (logo left `h-6`, Skip right), persistent across slides. On finish (Skip or "Start scoring") the header logo morphs into the home-screen logo slot: `finish()` measures the header logo rect + the home `[data-logo-anchor]` rect and animates a `fixed` flyer between them while the rest of the FTUE fades (`exiting` state), then `dismiss()` (set flag + onDone) unmounts the overlay — revealing ScoreKeeper's identical persistent logo already sitting at that spot, so the handoff is seamless. Fallback: if rects can't be measured, dismiss immediately. (jsdom can't measure rects, so tests cover the fallback path; the fly itself is browser-only.)

**Gotcha (fixed):** `<AnimatePresence initial={false}>` on the slide carousel cascades to ALL descendants, suppressing their mount-initial animations — so the S1 score chips snapped into place with no entrance. Fix: `ScoreStack` flips a `play` flag via `requestAnimationFrame` after mount and the chips/crown/CountUp animate off `play` (`animate={play ? show : hidden}`, `initial={false}`) instead of mount-initial. Re-plays when you swipe back to S1. If you add other mount animations inside a slide, drive them the same way.

**Slide heroes:** S1 `ScoreStack` = scores land SCATTERED (not a column): each `ScoreChip` is absolutely positioned at a loose rotation (`left/top/rotate/z/delay` in `STACK`) and pops+fades in (`SPRING_POP`) at uneven, non-sequential beats; score counts up (`CountUp` via `useMotionValue`/`animate`); crown pops onto the `leader` chip. Conveys spontaneity per Adrian (a game in motion, not a regimented reveal). S2 `PlayerChips` (3 color+emoji chips). S3 `MiniScoreboard` (2-row board, leader crown). Body copy is plain `text-white/70` (the frosted scrim was tried and removed — Adrian preferred clean text over the gradient).

**Copy (locked w/ Adrian):** S1 "Welcome to SCRKPR!" / "The simplest, most delightful way to prove who's better than the other". S2 "Set up the culprits" / "Give everyone a color and an emoji to match their confidence." S3 "Just tap to keep score" / "Settle the debate once and for all. We tally the points and keep the receipts — no account, no mercy."

**Living gradient background** (`src/components/OnboardingBackground.jsx`) — heavily-blurred radial color blobs (`currentColor` in the gradient so framer can tween color per slide), drifting on infinite mirrored loops; palette shifts per slide (S0 brand blue/violet/teal → S1 chip colors → S2 blue/gold/red). Reacts to interaction: **swipe parallax** via a shared `swipeX` MotionValue (the slide's `onDrag` sets it; springs back to 0 on release) and a **tap ripple** bloom (captured at the Onboarding root via `onPointerDownCapture`, rendered from the touch point). `mixBlendMode: screen` over the dark bg for glow; a radial vignette keeps text legible. Honors `useReducedMotion` (freezes drift). All transform/opacity/color → GPU-composited.

**Refinement levers (open):** blob count/size/placement, drift speeds, palette, glow intensity (`opacity 0.6`) and blur radius (72px), ripple size/feel, parallax depth (`parallax` per blob); the morphing welcome-logo → home-logo shared-element transition (not done); slide count/order; light vs. dark-only.

### 8. Session June 13 (pt. 4) — Save regulars (favorites)

Players can now be marked **regulars** (favorites) — replaces the old hardcoded `DEFAULT_SELECTED_NAMES = ["Adrian","Jayne"]` pin/pre-select hack.

- **Data:** a `favorite` boolean on the player record (persisted via the existing `db.players.update(id, { favorite })`; no store schema change — patches merge). Defaults falsy.
- **Star toggles:** tap a `Star` (lucide) to star/unstar. On the **Players page** (`Players.jsx`, gold `#FFC93C` when on) and inline on each **PlayerSetup** row. Both stop propagation on click + pointerdown so starring doesn't trigger edit / select / long-press / dnd drag.
- **PlayerSetup:** on load, favorites sort to the top **and** start pre-selected (`setSelectedIds(favs)`), so a typical game is one tap. Starring mid-session persists but does NOT live-reorder (the selected/unselected segments govern order during setup; the favorite ordering applies next load).
- **Players page:** favorites sort to the top (`[...players].sort(byFavorite)`); star hidden in select mode (the check badge takes its place). No framer `layout` on these rows (would deadlock the page `mode="wait"` exit) — reorder is instant.
- Verified: lint, build, store round-trip of the flag, and a render test that 2 seeded favorites pin to the top and pre-select (Start Game enabled).

**Polish pass (grilled w/ Adrian via grill-me):**
- **Section headers** on the Players page — "Favorites" / "All Players", shown ONLY when there's a split (both groups non-empty); a single group (all-fav or none-fav) renders a plain list. Headers are keyed motion.divs that fade with `AnimatePresence`.
- **Manual-FLIP reorder glide** — when you star/unstar, the card glides to its new section. Implemented WITHOUT framer `layout` (which deadlocks the page `mode="wait"` exit): a `useLayoutEffect` measures each `[data-row-id]` outer div's viewport top and inverts→plays a `translateY` transform. Three-layer rule: outer `motion.div` owns the FLIP transform + framer touches only its opacity/height (so the manual transform isn't clobbered); inner `motion.button` owns the entrance rise + tap squish (separate element, transforms compose). Skipped on first mount (`flipReady` ref) so the entrance stagger owns load.
- **Star bounce** — pop on every tap via a `poppedId` state + keyframe `scale:[1,peak,1]` (cubic-bezier overshoot); bigger peak (1.4) when turning ON, subtler (1.18) when OFF. Pops only the tapped star (not all on load). Same treatment in PlayerSetup.
- **44px hit box** — star tap target is `w-11 h-11` (the platform min) on both Players + setup; icon stays 18px.
- Naming aligned to "favorite" (aria-labels "Add/Remove from favorites").
- Verified: lint, build, render tests for split/all-fav/none-fav header rules + favorite ordering, plus setup-pinning and FTUE regressions.
- **The Players list is now FULLY MANUAL — no framer on rows/headers (after two device-reported snaps).** History: (1) FLIP on a `motion.div` → framer rewrote its transform → card *teleported*; (2) moved FLIP to a plain inner div but kept `motion.div` opacity/height wrappers + a framer height-accordion header → the "remove all favorites" case still snapped. Final: **rows and section headers are plain `<div>`s**; a single `useLayoutEffect` does manual entrance (staggered rise+fade on first load via `data-idx`, quick pop later) AND manual FLIP (invert→play `translateY` via `animateTo`, `transitionend` cleanup, `flippingIds` guard so in-flight rows aren't re-measured). Headers mount/unmount instantly; the rows' FLIP glides everything below them (incl. when a header appears/disappears), so no snap. The ONLY framer left in a row is the isolated star/check icon pop (scales an icon, never touches layout). This is exactly PlayerSetup's pattern. If you ever re-add framer to these rows, expect the snap back. Animation still not confirmable in jsdom (no CSS transitions) — feel on device.
- **Header-jump fix (device-reported):** when going to all-favorited / none-favorited, the section headers used to fade opacity while keeping their height, then vanish — snapping the list. Now each header is an **accordion**: `initial/exit {height:0}` ↔ `animate {height:"auto"}` (+opacity), `overflow:hidden`, ~0.28s. framer animates height without a React re-render, so it doesn't trip the FLIP `useLayoutEffect`, and rows below reflow smoothly. Row spacing moved from the container's `space-y-2` to per-row `mb-2` so a collapsed header leaves no residual margin hop. (A `delay` on the header transition is the lever if we want the star bounce to land before the regroup.)

### 9. Session June 13 (pt. 5) — End Game modal matches History hero

`EndGameModal.jsx` winner block + standings were restyled to mirror the History "Latest Game" hero (visual through-line): winner-color gradient card (`linear-gradient(155deg, color30→color10→card)`) + hairline border (`color66`), oversized ghosted winner emoji bleeding off the corner (size 130, rotate 16°, opacity .22), w-14 emoji avatar (trophy pop + wiggle kept), `font-display` name under a 🏆 label, "pts · {modeMeta.emoji} {modeMeta.label}" line (via `getModeMeta`), and a podium of per-player emoji chips + 🥇🥈🥉 medals with color-matched bold scores. Ties → muted `🤝` + `hsl(var(--card))` bg. Confetti finale + end-game stats (most rounds / worst score / total rounds / time) unchanged. (Modal only renders mid-game so it's not in the jsdom harness — verified by lint + build + parity with History markup.)
- **Follow-up (device-reported):** originally the podium lived INSIDE the bordered hero card (like History). With a long roster the card became a tall scroll region whose winner-color side borders ran past the sheet's top edge (no sticky header to mask them). Fix part 1: the bordered gradient hero is now **compact (winner only)** and the **standings are a borderless list below it** — same emoji chips + medals, just not enclosed.
- **Follow-up 2 — FINAL:** the bleed root cause was the hero's **colored border** — when the card scrolled up, its vertical sides ran to the body's hard `overflow` top edge. Tried a top-fade mask in `BottomSheetModal` (and briefly broke scroll with an `h-full` flex trap — use `flex-1`, never `h-full`, for a scroll area in a flex column). Both reverted. **Final fix: the hero card has NO border** (just the gradient + ghosted emoji + big avatar — gradient bumped to `3a/14` to stay defined). `BottomSheetModal` body is the plain `flex-1 overflow-y-auto` scroller again; content clips cleanly under the header whose `border-b` fades in on scroll (the crisp "cap" Adrian wanted). No colored line can bleed; no fade muddiness. If you ever re-add a colored border to a card that scrolls inside a sheet, expect the bleed back.

### 10. Session June 13/14 (pt. 6) — App Store readiness + Capacitor scaffold

App Store track started (iOS-only). See **`APP_STORE_READINESS.md`** (review + punch list) and **`CAPACITOR_iOS.md`** (the macOS runbook).

- **Quick wins shipped:** `index.html` got `viewport-fit=cover` (fixes `env(safe-area-inset-*)` on notched iPhones — was a real no-op bug) + native head metas (theme-color, apple-mobile-web-app-*, apple-touch-icon). `package.json` renamed `base44-app` → `scrkpr`. Pruned 16 unused starter deps + deleted 8 dead files (7 `ui/` components + `ProtectedRoute.jsx`). (Bundle didn't shrink — already tree-shaken — but node_modules/audit surface did.)
- **Icon:** `src/assets/SCRKPR-Icon.icon` is a valid **Icon Composer (Liquid Glass)** bundle — gradient bg + glass S-monogram SVG, with dark=orange / tinted=blue variants. It's the iOS app icon; set it in Xcode (needs Xcode 26). No raster PNG needed (iOS-only; web favicon is cosmetic).
- **Splash:** `assets/splash.png` + `assets/splash-dark.png` (2732², black + white wordmark) for `@capacitor/assets generate` on the Mac. Source: `src/assets/SplashScreen.png` (4096²) also present.
- **Capacitor v8** installed (`@capacitor/core`, `/ios`, `/cli`, `/status-bar`, `/splash-screen`). `capacitor.config.json`: appId `com.illudcrab.scrkpr`, name SCRKPR, webDir `dist`, dark bg, SplashScreen launchAutoHide:false. `main.jsx` hides the splash + sets a light-content status bar — **guarded by `Capacitor.isNativePlatform()` and dynamic-imported**, so zero effect on web (verified: `getPlatform()==="web"`, native=false). npm scripts: `cap:sync`, `cap:assets`, `ios`. `@capacitor/assets` NOT installed in repo (its `sharp` dep can't fetch a binary in the sandbox) — installs fine on macOS.
- **`cap add ios` / Xcode / device test = on Adrian's Mac** (can't run macOS tooling here). Runbook has the ordered commands.
- **⚠️ Test-harness caveat:** adding Capacitor makes Vite **code-split** the build (a `web` chunk), so the scratch jsdom render tests (`render*.test.mjs`, `players-seg`, `regulars`) — which `eval` a single classic-script bundle — no longer work; they choke on inter-chunk `import`s. The **store/fav-store** unit tests and a new **`cap-web`** no-op check still work. For full render regression now, use a real browser/device or a single-file test build (`manualChunks` override). Device testing supersedes this for the native track anyway.

### 11. Session June 14 (pt. 7) — core-loop simplification (pre-ship deep-think)

A product pass on the core interactions (grilled w/ Adrian). Three changes:

- **Scoring is number-pad-only.** Removed the ± quick buttons + the 1.5s batching (`pendingDelta`/`handleQuickTap`) from `PlayerColumn`. Every mode is now one uniform action: **tap a player → number pad → enter the round**. Best Of still adds +1 per tap (ScoreBoard `handleOpenScore` short-circuits in `circleMode`). Rationale: one obvious input; "safer to add back than remove later." `onQuickScore` plumbing dropped.
- **Generic game modes.** Picker is now just **High Score / Low Score / Best Of** (no named games). High/Low take an **optional target** ("End at score") — reaching it auto-ends the game (logic already existed in ScoreBoard). This covers the old presets generically: **Gin = High + 100**, **"Swish" = Low + 500** (first to 500 ends it, *lowest* total wins — verified). `GameModeModal` rewritten (mode chips + target input + Done); `PlayerSetup` carries `targetScore` state → `onStart(..., targetScore)`. `gameModes.js` keeps the legacy `ginrummy`/`swish` entries for old-history display, but they're gone from the picker. Default mode is now `high`.
- **Scoreboard sort follows the mode.** Removed the manual asc/desc toggle (its icon was a misleading `Shuffle` glyph; it was never a randomizer) + `sortDesc` state. Direction now derives from `isLowMode(winMode)`. **Lock** stays (freeze order). No real shuffle existed; a true "shuffle turn order" is a clean future add.
- Verified: lint, build, `modes.test.mjs` (metadata + Swish/Gin semantics + legacy lookups), store/fav-store. (Render-harness still chunk-limited from Capacitor — fine.)

### 12. Session June 14–15 (pt. 8) — scoreboard tabs, round guard, FTUE/nav polish, icon rebrand

- **Scoreboard tabs.** Replaced the inline "Show Score History" collapsible with a History-style segmented pill on `ScoreBoard`: **Scoreboard ↔ Rounds**. `ScoreHistoryPanel` is now an always-on table (toggle removed) shown in the Rounds tab; body swaps via `AnimatePresence mode="wait"`. Tabs only render when `!isCircleMode(winMode) && maxRounds > 0`; `view` snaps back to board if they disappear.
- **Round-completion guard + accumulate (`ScoreBoard` + `PlayerColumn`).** `currentRound = min(scores.length)`. `scoredThisRound = scores.length > currentRound`. A scored player's flourish emoji morphs to ✅ (`PlayerColumn`, `scoredThisRound` prop, AnimatePresence swap). Tapping the player body when already scored **accumulates** onto `scores[currentRound]` (`handleSubmit`: `onEditScore(id, currentRound, existing + value)`) — no new entry, no skip-ahead; round advances only when all logged. Tapping the tiny "(+X)" subtext still **replaces** that entry (correction). Verified by `round`/`accum` tests.
- **PlayerColumn card no longer grows** when a score is logged — the "(+X)" subtext line is always reserved (`h-[18px]`) for high/low modes.
- **Emojis added** (`EmojiPicker`): 🌋 volcano, 🏄 surfer, 🏇 horse-with-rider/jockey. No dedicated cowgirl emoji exists → "cowgirl" keyword added to 🤠 + 🏇.
- **FTUE polish:** CTA button is now **white** (was accent-blue); the **tap ripple was removed** (state/handlers/props cleaned out — gradient drift + swipe parallax remain).
- **Bottom nav spacing:** `BottomNavigationBar` bottom padding `safe-area + 24px` → **`+ 32px`** (matches the 88px the Players/History lists reserve).
- **⚠️ APP ICON — in flux (this is the live blocker).** The original Liquid Glass `.icon` (`src/assets/SCRKPR-Icon.icon`, geometric S monogram) was scrapped — the S read too much like a swastika in isolation (rotational bladed form). Adrian pivoted the brand to a **hand-painted brush wordmark** (`SCRKPR!`). Plan: a brush letterform can't have that problem; **cut a single glyph (the "S", and/or the "!") out of the real brush wordmark** and center it on the `#111` tile = a **classic raster 1024² PNG icon** (NOT Liquid Glass — brush texture is raster, doesn't fit the layered-glass `.icon` model). **Next step:** Adrian drops the high-res brush `SCRKPR!` PNG into `src/assets/`; then cut S + ! candidates, pick one, generate the icon set, update manifest/apple-touch-icon + the Xcode app icon, retire the `.icon`. (Old `SCRKPR-Icon.icon` + `AppIcon.png` 288px can be deleted.)
- **iPad:** brainstormed (not built) — the big idea is "iPad = communal center-of-table board": landscape columnar scoreboard, glanceable from across the table, persistent rounds side-panel. Ship iPhone first, then iPad as its own update (same codebase, responsive). Parked.

### 5. Bug fixes worth knowing about

- **Stacking-context trap**: page wrappers are transformed (`motion.div` page transitions), so fixed overlays at app level paint over modals regardless of modal z-index. The tab-bar gradient fade in `ScoreKeeper.jsx` now hides whenever `navHidden` is true (same signal pages send via `onModalChange` when any modal opens). If you add fixed overlays, follow this pattern.
- **`BottomSheetModal`** (shared sheet shell): scrollable body has bottom padding + footer gets `border-t` so content doesn't collide with footer buttons; header `border-b` fades in once the body is scrolled (matches footer treatment).
- `.env.local` missing = silent backend failures (see Local setup).

## Conventions

- Import animation values from `@/lib/motion` and colors from `@/lib/colors` — no inline springs/durations/hex.
- Modals use `BottomSheetModal` (which portals to `document.body`); player editing uses `PlayerEditModal` everywhere.
- Pages signal modal-open via `onModalChange` so `ScoreKeeper` hides nav + gradient.
- Emojis render through `FluentEmoji` (Microsoft Fluent 3D via CDN, unicode `<span>` fallback).
- The SCRKPR logo is local (`@/assets/scrkpr-logo.svg`, white `SCRKPR!` wordmark) — never re-add the media.base44.com URL.
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

### 13. Session June 27 — pre-submission code review + cleanup

A review/tidy pass (no feature changes). Repo confirmed green: `npm run lint` clean, `vite build` exit 0 (temp `--outDir`), and 18 recreated logic tests pass (store CRUD/ordering/limit/merge/clearAll/corrupt-JSON + mode metadata incl. Gin/Swish + round/accumulate/Swish-low-wins).

- **Dead code removed:** `GameMenuModal.jsx` was unreferenced (only its own definition existed) — deleted.
- **Unused deps removed** (zero references anywhere in `src/`, incl. cross-`ui/`): `lodash`, `zod`, `@hookform/resolvers`, `react-hot-toast` (only a comment in `use-toast.jsx`), `@radix-ui/react-toast` (`ui/toast.jsx` uses `cva`, not the Radix primitive). `package.json` + `package-lock.json` updated; re-installed, re-linted, re-built — all green. (False positives kept: `@capacitor/{status-bar,splash-screen}` are dynamic-imported in `main.jsx`; `@capacitor/ios` is native-only; `@base44/vite-plugin` + `tailwindcss-animate` are config-file deps.)
- **Clean review signals:** no `base44.entities.*` calls remain (only comments in `store.js`); no `media.base44.com` URLs; no `TODO/FIXME`; all `console.*` are legit fail-soft catch-block logging.

**`ui/` prune — DONE (June 27):** only 5 of 42 shadcn components were reachable (`button`, `input`, `toast`, `toaster`, `use-toast` + `button`'s `@radix-ui/react-slot`). Deleted the other 37 unreferenced starter components and removed the **28** deps they orphaned (24 `@radix-ui/*` + `next-themes`, `react-hook-form`, `sonner`). `package.json` went **53 → 20** dependencies. Re-installed, lint clean, `vite build` exit 0, 18 logic tests pass, and `npm run dev` boots clean (served `/`, `main.jsx`, `App.jsx`, `toaster.jsx` all 200, log clean). Since the bundle was already tree-shaken this is audit-surface / node_modules / npm-audit-noise reduction, not a runtime change.

**`npm audit` — reviewed (June 27), `npm audit fix` NOT run:** 16 advisories (8 high, 7 moderate, 1 low), **all auto-fixable / non-breaking**. The pruned Radix deps weren't the source, so the count is unchanged. Categories: (a) **build-time only** — vite (direct), rollup, postcss, @babel/core, js-yaml, ajv, brace-expansion, minimatch, flatted, picomatch — don't ship in the iOS bundle; (b) **dormant `@base44/sdk` socket transport** — ws, socket.io-parser, engine.io-client, form-data — never execute while `SYNC_ENABLED=false` (stub client); (c) **live app runtime** — `react-router`/`react-router-dom` — the only ones that actually ship + run. Recommend `npm audit fix` (esp. for router) + a quick device retest before submission.

**Still open (recommendations):**
- **`@base44/sdk` still bundled:** `base44Client.js`/`AuthContext.jsx` statically import it even though the stub is what runs offline, so the SDK (and its dormant socket deps) ship in the bundle. Fully dropping it is a phase-2 task (tied to the sync decision), not a safe pre-submission edit.
- **Minor:** stale `phase10` references in `ScoreBoard.jsx` comments (no longer a mode) — harmless. The stale icon assets mentioned in earlier review notes were resolved in §14.

### 14. Session July 5 — logo + icon pass (`logo-icon-pass`) — icon blocker RESOLVED

Adrian delivered the final brand assets; this branch wires them through everything.

- **New icon (final direction):** coral `#FA5845` tile + four white circles, bottom-right one hollow (a score-dot/tally motif). Sources: **`assets/Icons/SCRKPR.icon`** (Icon Composer / Liquid Glass bundle — coral gradient fill, translucent Circles layer, dark/tinted-aware) + flat SVG variants in `assets/Icons/SVG/` (`SCRKPR - Color/Dark/Light.svg` 1024², `Circles.svg`). Rasterized `Color.svg` → `public/favicon.png` (512²) and `ios/.../AppIcon.appiconset/AppIcon-512@2x.png` (1024²), so the app has a working icon everywhere NOW. **Remaining Mac step:** in Xcode 26, set `assets/Icons/SCRKPR.icon` as the app icon to get the full Liquid Glass treatment (the raster in the appiconset is the fallback until then).
- **New logo:** groovy `SCRKPR!` wordmark, **`src/assets/scrkpr-logo.svg`** (659×150, white fill — the app is forced dark). All 5 `logoDark` imports (`ScoreKeeper`, `ScoreBoard`, `PlayerSetup`, `Onboarding`, `ErrorBoundary`) repointed from the old `SCRKPR_dark_mode.png`; source copy also at `assets/scrkpr-logo.svg`.
- **Splash regenerated from the new wordmark:** 2732² ink `#111111` bg + white wordmark centered at ~45% width → `assets/splash.png` + `assets/splash-dark.png` AND all 9 PNGs in `ios/.../Splash.imageset/` (so no `@capacitor/assets` run is needed; if you do run it, it reads the same `assets/splash*.png`).
- **Retired (deleted):** `src/assets/SCRKPR_{dark,light}_mode.png`, `SCRKPR-Icon.icon` (old geometric S), `AppIcon.png`, `SplashScreen.png`.
- PNGs were rasterized with `sharp` in a scratch dir (not a repo dep). Verified: lint clean, `vite build` exit 0, SVG logo lands in `dist/`.

### 15. Session July 5 — last-10% interaction polish (`SCRKPR` working tree)

Small but visible motion/feel fixes while testing the live app at `http://127.0.0.1:5174` (dev server was on `:5174`, not the default `:5173`). Committed and merged to `main` (this section's edits are no longer in the working tree).

- **Shared modal exit animation (`BottomSheetModal.jsx`, `EndGameModal.jsx`).** Bottom sheets now stay mounted long enough to animate down on close/tap-outside, and the backdrop blur fades out instead of disappearing. `BottomSheetModal` owns the render delay (`shouldRender`, ~420ms) and animates `isOpen` state directly. `EndGameModal` no longer wraps the sheet in an outer `AnimatePresence`; it always renders the shared sheet with `isOpen`.
- **Score modal close path (`ScoreBoard.jsx`, `ScoreInputModal.jsx`).** The Add Score modal used to vanish instantly because `activePlayer` was cleared as soon as close fired. `ScoreBoard` now separates `scoreModalOpen` from `activePlayer`, delays clearing player/editing state until after the sheet exit, and `ScoreInputModal` keeps the last player/edit index in refs during exit.
- **Number pad contrast (`NumberPad.jsx`).** All Add Score controls are white now, including `Clear` and Back/Delete; before they were gray while digits were white.
- **Slide-to-end-game control (`SlideToEndGame.jsx`, `ScoreBoard.jsx`).** The old End Game pill was replaced by a slide-to-confirm control. It slides down/offscreen whenever the End Game modal or Add Score modal opens, then slides back up when the modal closes/Keep Playing is tapped. The release-state copy now centers in the full control (`Release to End Game` no longer has the old right padding). The label text uses title case in code: `Slide to End Game` / `Release to End Game`.
- **Tab highlight motion (`StretchTabPill.jsx`, `History.jsx`, `ScoreBoard.jsx`, `index.css`).** History `Games ↔ Stats` and scoreboard `Scoreboard ↔ Rounds` no longer use `layoutId`/spring pills. A new shared `StretchTabPill` drives a bounded elongate-then-constrict effect with CSS keyframes (`stretch-tab-pill`): it stretches within the wrapper, never leaves the track, and avoids the accidental bounce. Important: this intentionally uses CSS keyframes because Framer keyframes for the earlier `left`/`width` and transform attempts were observed snapping in the in-app browser.
- **Main bottom nav (`BottomNavigationBar.jsx`).** Removed the bouncy shared-layout `nav-active-pill`. The active background is now one persistent absolute wrapper that glides via `transform 250ms cubic-bezier(0.4, 0, 0.2, 1)`. Icon/tap motion now uses the calmer panel transition and a smaller tap scale.
- **Emoji picker duplicate-key warning (`EmojiPicker.jsx`).** Duplicate emoji entries can exist for search aliases; list keys now include the index so React does not warn on repeated emoji values.

**Verified this pass:** `npm run lint` clean; `npm run build` passes. In-app browser geometry checks confirmed the History tab stretch state stays inside the wrapper and the main nav pill glides from Players to History without spring bounce.

### 16. Session July 6 — one unified modal + white modal text + Reset slide-down

> **Git state:** committed as `bdf90b6` and **merged into `main`** via PR #22. Working tree is clean; `.claude/launch.json` stays at the committed `--port 5174`. (During the session it was branched on `fix-odd-ends`; that's now merged.)

**Goal (Adrian): one modal primitive for the whole app — "the app is way too simple to justify multiple modal types."** Plus: all modal text/characters white, and the End-Game slide control should retract when Reset opens (matching the Add-Score behavior).

- **Unified on `BottomSheetModal` (killed the two hand-rolled confirm modals).** History "Clear All Games?" (`History.jsx`) and Settings "Clear All Data?" (`AccountSettings.jsx`) each had their own inline `AnimatePresence` + backdrop + partial `y:120` slide — replaced both with `<BottomSheetModal>`. Removed the now-orphaned imports (`History`: `TRANSITION_PAGE`; `AccountSettings`: `motion`/`AnimatePresence`/`SPRING_SHEET`). Both now inherit the shared slide-down + blur-fade-out exit and drag-to-dismiss for free. `BottomSheetModal` is now the **only** modal implementation; `ResetConfirmModal`/`DeletePlayerConfirmModal`/`PlayerEditModal`/`GameModeModal`/`BestOfModal`/`ScoreInputModal`/`EndGameModal` are all thin prop-config wrappers around it (not separate modal types).
- **New `icon` prop on `BottomSheetModal`.** Optional slot rendered centered above the eyebrow/title in the header, wrapped in `text-white` so a lucide icon inherits white via `currentColor`. The two confirm modals pass `<AlertTriangle size={32} strokeWidth={2} />` (no color class) → renders white (was `text-accent-red`).
- **White modal text, app-wide (via the shared shell).** In `BottomSheetModal` the header text moved to: title `text-white` (was `text-foreground`/93%), eyebrow `text-white/60`, description `text-white/70` (both were `text-muted-foreground`). Since every modal routes through the shell, this lands everywhere. (Adrian's spec: white text, muted secondary text → white at reduced opacity, keep red *fills*.)
- **Named red triggers → white (red fills kept).** Settings "Clear" button (`text-accent-red` → `text-white`, keeps `bg-accent-red/10`); History "Clear All" header trigger (`text-muted-foreground hover:text-accent-red` → `text-white/70 hover:text-white`); `PlayerEditModal` delete/trash trigger (`text-accent-red` → `text-white`, keeps `bg-accent-red/15`). The filled destructive confirm buttons ("Delete", "Reset", "Yes, Clear", "Yes, Clear All") keep their red background — their text was already white.
- **Reset Scores now retracts the slide-to-end control (`ScoreBoard.jsx`).** Added `|| showResetConfirm` to the two conditions already driving `SlideToEndGame`'s wrapper (`y: … ? 120 : 0` and `pointerEvents`). So tapping the ↺ Reset button slides the control down/offscreen (and disables it) exactly like opening the Add-Score pad or End-Game modal; it springs back up on Cancel/dismiss.

**Verified this pass:** `npm run lint` clean; `npm run build` exit 0. In-browser (preview on `:5176`, mobile viewport): History "Clear All Games?" renders as the unified sheet with confirmed computed colors — title `rgb(255,255,255)`, description `rgba(255,255,255,0.7)`, ⚠️ icon `rgb(255,255,255)` — and dismisses on tap-outside; the History "Clear All" trigger reads `rgba(255,255,255,0.7)`. Reset flow: tapping ↺ set the slide control's `pointerEvents:none` and animated `y` 0→120 while the "Reset all scores?" sheet rose; Cancel returned it to `y:0`/`pointerEvents:auto` (all measured). Settings "Clear All Data?" verified by code parity (identical `BottomSheetModal` invocation) + clean of dangling refs + lint/build — a live screenshot wasn't captured because the backgrounded preview tab froze framer's page-transition (`requestAnimationFrame` pauses in hidden tabs; every page went blank, proving it's environmental, same rAF freeze noted in §15).

## Open items

- [x] ~~APP ICON (was the active blocker)~~ — **RESOLVED July 5** (§14): coral-circles direction final; favicon + Xcode raster + splash all wired. Only Mac step left: set `assets/Icons/SCRKPR.icon` in Xcode 26 for Liquid Glass.
- [ ] **Finish the iOS submission** — on the Mac: `CAPACITOR_iOS.md` runbook (set icon, sign w/ team `8RJXUWMLNF`, set iPhone-only, `ITSAppUsesNonExemptEncryption=NO`, device-test, Archive → upload), then paste `APP_STORE_CONNECT.md` into App Store Connect + submit.
- [ ] **Device-test on a real iPhone (high priority).** The player-list drag/toggle + favorites FLIP + the round-guard morph + safe-area insets were all verified in headless DOM / logic only. Feel them on hardware. If the nav still hugs the bottom on-device, the safe-area inset may not be reaching the webview (`viewport-fit`/`contentInset`).
- [~] **Local-first** — phase 1 done (§6). Remaining (only if/when cross-device wanted): the Base44 sync layer + first-launch migration, both behind `SYNC_ENABLED`.
- [ ] **iPad version** — scoped/brainstormed (§12), not built. Ship iPhone first.
- [ ] **Merge/publish caution** — Base44 syncs `main`; confirm its Builder/publish flow tolerates the stubbed SDK (`SYNC_ENABLED=false`) before relying on it.
- [ ] **`npm audit fix` (from §13, not run):** 16 non-breaking advisories; only `react-router`/`react-router-dom` actually ship + run — bump + device-retest before submission. Rest are build-time or dormant base44-SDK socket deps.
- [ ] **Drop `@base44/sdk` from the bundle (phase 2):** still statically imported though the stub runs offline; removing it clears the dormant socket-dep advisories. Tied to the sync decision.
- [x] ~~Pre-submission code review + cleanup~~ — green build/lint/tests; dead `GameMenuModal` + 5 dead deps removed, then full `ui/` prune (37 components, deps 53→20), dev server verified (§13).
- [x] ~~App Store readiness pass / quick wins~~ — viewport-fit, head metas, dep prune, package rename, Capacitor scaffold all done (§10).
- [x] ~~Core-loop rework~~ — generic modes, number-pad-only scoring, sort-follows-mode, round guard + accumulate (§11, §12).
- [x] ~~Async/network error handling~~ — resolved by local-first (§6).
- [x] ~~Optional polish / visual pass / FluentEmoji fallback / local logo / rotate Base44 key~~ — all done (§4, earlier).

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

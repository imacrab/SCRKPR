# SCRKPR — App Store Readiness Review

> Reviewed June 13, 2026, against the current `delight-pass` state. Verdict + a prioritized punch list for the native track.

## Verdict

**In strong shape to start the App Store track.** The hard architectural call — going local-first, no account, fully offline — is exactly what you want for an App Store app: no login friction, no backend dependency, privacy-friendly, and it can't break when a server does. Build is clean (218 KB gzipped JS), lint is clean, the design language is cohesive and genuinely delightful, and there's a real `ErrorBoundary` + a resilient local store. Nothing here is a blocker; the list below is "tighten before you ship," not "rebuild."

## Strengths (keep leaning on these)

- **Local-first**: players + history on-device, zero network on the happy path, honest "Saved on this device" story. Huge for review/approval and for reliability.
- **No account for v1**: removes the single biggest onboarding drop-off and a whole class of privacy/ATT concerns.
- **Polish**: FTUE, leader crown, confetti, the History/End-Game hero parity, the manual-FLIP lists — it *feels* premium, which is rare for a v1.
- **Mobile fundamentals mostly right**: `100dvh`, safe-area padding throughout, 44px touch targets, forced dark.

## Must-fix before submission

1. ~~**`viewport-fit=cover` missing**~~ — ✅ **Done.** `index.html` viewport is now `width=device-width, initial-scale=1, viewport-fit=cover`, so `env(safe-area-inset-*)` resolves on notched iPhones.
2. **App icon + splash** — `public/favicon.png` (a single 512 derived from the wordmark) is the only icon. Needs a real 1024² icon, the Capacitor icon set, maskable/round variants, and launch/splash screens. *(Adrian is preparing these + store images.)* `apple-touch-icon` currently points at the favicon as a placeholder — swap when the real icon lands.
3. ~~**Native/PWA `<head>` metas**~~ — ✅ **Done.** Added `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (black-translucent), `apple-mobile-web-app-title`, and an `apple-touch-icon` link.
4. **Device-test the touch interactions** — the player-list drag + toggle and the favorites FLIP glide were verified in headless DOM (which can't render real transforms or touch timing). Feel them on a physical phone before submitting; highest-risk-on-device item.

## Should-fix (hygiene, not blocking)

5. ~~**Dependency bloat**~~ — ✅ **Done.** Removed 16 unused deps (`@stripe/*`, `react-leaflet`, `jspdf`, `html2canvas`, `react-quill`, `moment`, `react-markdown`, `three`, `recharts`, `embla-carousel-react`, `react-day-picker`, `cmdk`, `vaul`, `input-otp`, `react-resizable-panels`) and deleted the 7 dead `ui/` components that referenced them (chart, carousel, calendar, command, drawer, input-otp, resizable). *Note: the runtime bundle was already ~218 KB gzipped and didn't shrink — Vite was tree-shaking the unused imports anyway. The win is a lighter `node_modules`, faster installs, smaller supply-chain/audit surface, and no dead files.*
6. ~~**Dead code: `ProtectedRoute.jsx`**~~ — ✅ **Deleted** (was unimported). `AccountSettings` still imports `base44` for a Sign Out button that only renders when `SYNC_ENABLED` — fine; tidy when you revisit sync.
7. ~~**`package.json` name `"base44-app"`**~~ — ✅ **Renamed** to `scrkpr`.
8. **No committed tests** — the jsdom/store smoke tests used this whole project live in scratch, not the repo. Committing a small smoke harness (store CRUD + "app mounts offline") would catch regressions as you add the native layer. *(Still open — optional.)*

## Nice-to-have

- Consider `maximum-scale=1, user-scalable=no` in the viewport if double-tap-zoom on the +/- score buttons feels off (trade-off vs. accessibility — your call).
- A PWA service worker would make the web build installable/offline too, but Capacitor handles the native case, so this is optional.

## The App Store track (suggested sequence)

1. **Quick wins first** (≈1 sitting): viewport-fit + head metas + `package.json` rename + dependency prune. All low-risk, and they clear the deck.
2. **App icon**: design/generate a real 1024² SCRKPR icon (the wordmark won't work as a square app icon — needs a standalone mark). Generate the full iOS/Android icon + splash set from it.
3. **Wrap with Capacitor**: add `@capacitor/core` + CLI, `npx cap init`, add the iOS platform, point it at the Vite build, run icon/splash generation, open in Xcode.
4. **Device pass**: test the touch drag/FLIP, safe-area on a notched device, end-game confetti, and the FTUE on a real phone.
5. **Store prep**: bundle ID, screenshots, privacy nutrition label (easy — "no data collected" since local-only), App Store description.

Auth/sync stays deferred behind `SYNC_ENABLED` — don't let the native track pull it back in unless you actually want cross-device.

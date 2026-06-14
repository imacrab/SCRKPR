# SCRKPR — iOS (Capacitor) Runbook

Everything in `capacitor.config.json` + `assets/` + the `.icon` is scaffolded. These steps run on **macOS** (Xcode/CocoaPods can't run in the cloud sandbox).

- **App ID:** `com.illudcrab.scrkpr`  ·  **Name:** SCRKPR  ·  **webDir:** `dist`
- **Prereqs:** macOS, **Xcode 26+** (required for the Liquid Glass `.icon`), CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`), an Apple Developer account.

## One-time setup

```bash
git pull                      # get the Capacitor scaffold
npm install                   # installs Capacitor + (on Mac) sharp for @capacitor/assets
npm run build                 # vite -> dist/
npx cap add ios               # creates ios/ Xcode project + runs pod install
npx @capacitor/assets generate --ios   # generates splash from assets/splash*.png
npx cap sync ios              # copies web build + plugins into the iOS project
```

> The `assets/splash.png` + `assets/splash-dark.png` (2732²) are already in the repo, so `@capacitor/assets` will produce the launch-screen images. `@capacitor/assets` needs `sharp`, which installs fine on macOS (it failed only in the cloud sandbox).

## App icon — the Liquid Glass `.icon`

1. Open the project: `npx cap open ios` (opens `ios/App/App.xcworkspace`).
2. In Xcode, select the **App** target → **General** → App Icons, or open the asset catalog.
3. Set the app icon source to **`src/assets/SCRKPR-Icon.icon`** (Xcode 26 accepts the Icon Composer `.icon` directly — drag it in / point the App Icon at it). Xcode generates every size, the light/dark/tinted variants, and the flattened fallback for pre-iOS-26 automatically.
   - Eyeball the variants once: default = glassy gradient, **dark = orange S**, **tinted = blue S**.

## Xcode settings to confirm

- **Bundle Identifier:** `com.illudcrab.scrkpr` (Capacitor sets this from `appId`; confirm under Signing & Capabilities).
- **Display Name:** SCRKPR.
- **Signing:** select your Team (automatic signing is easiest).
- **Deployment target:** iOS 15+ is fine; the glass icon lights up on iOS 26, older falls back.
- Confirm `viewport-fit=cover` is doing its job: the UI should respect the notch/home-indicator (safe-area padding is already in the CSS).

## Device pass (do before submitting)

Run on a real iPhone (`npx cap run ios` or Run in Xcode) and verify:
- Player-list **drag + toggle** and the **favorites FLIP glide** feel right (touch timing — the thing headless testing can't confirm).
- Safe areas on a **notched device** (nothing under the notch/indicator).
- **FTUE** plays on first launch; **End Game** confetti + scroll behave.

## Submit

```bash
# after any web change:
npm run build && npx cap sync ios
```

In Xcode: **Product → Archive → Distribute App → App Store Connect**. Then in App Store Connect: create the app record (uses the bundle ID), fill the **privacy nutrition label** — for SCRKPR this is **"Data Not Collected"** (everything is on-device, no account, no network), add screenshots + description, and submit for review.

## Iterating later

Web/UI changes: edit `src/`, then `npm run build && npx cap sync ios`, re-run. No need to re-add the platform. Keep auth/sync deferred behind `SYNC_ENABLED` unless you actually want cross-device.

# SCRKPR — iOS (Capacitor) Runbook

Everything in `capacitor.config.json` + `assets/` + the `.icon` is scaffolded. These steps run on **macOS** (Xcode/CocoaPods can't run in the cloud sandbox).

- **App ID:** `com.illudcrab.scrkpr`  ·  **Name:** SCRKPR  ·  **webDir:** `dist`  ·  **Team ID:** `8RJXUWMLNF`
- **Prereqs:** macOS, **Xcode 26+** (required for the Liquid Glass `.icon`), an Apple Developer account. **No CocoaPods** — this project uses **Swift Package Manager** (`ios/App/CapApp-SPM`); there is no Podfile.

## One-time setup — already done (committed)

The `ios/` Xcode project is scaffolded and committed (`ios/App/App.xcodeproj`, SPM-based). You do **not** re-run `npx cap add ios`. The splash imageset + raster icon are in the asset catalog. Also already applied (July 7): `ITSAppUsesNonExemptEncryption = NO` in `Info.plist`, `TARGETED_DEVICE_FAMILY = 1` (iPhone-only), and a fresh `npm run build && npx cap sync ios`.

The only command you need after a web change:

```bash
npm run build && npx cap sync ios   # rebuild dist/ and copy it into the iOS project
```

> Splash images (`assets/splash*.png`, 2732²) are already generated into `ios/.../Splash.imageset/`, so a `@capacitor/assets generate` run is optional.

## App icon — the Liquid Glass `.icon`

1. Open the project: `npx cap open ios` (opens `ios/App/App.xcworkspace`).
2. In Xcode, select the **App** target → **General** → App Icons, or open the asset catalog.
3. Set the app icon source to **`assets/Icons/SCRKPR.icon`** (Xcode 26 accepts the Icon Composer `.icon` directly — drag it in / point the App Icon at it). Xcode generates every size, the light/dark/tinted variants, and the flattened fallback for pre-iOS-26 automatically. (A 1024² raster fallback — `AppIcon-512@2x.png` — is already wired into the asset catalog, so the app has a working icon even before you do this step.)
   - Eyeball it once: coral `#FA5845` tile + four white circles (bottom-right one hollow). The old geometric-S `.icon` was scrapped (§14 in HANDOFF) — do not reference `src/assets/SCRKPR-Icon.icon`; it's deleted.

## Xcode settings to confirm

- **Bundle Identifier:** `com.illudcrab.scrkpr` (Capacitor sets this from `appId`; confirm under Signing & Capabilities).
- **Display Name:** SCRKPR.
- **Signing:** Signing & Capabilities → check **Automatically manage signing** → select your Team (**`8RJXUWMLNF`**). Xcode creates the provisioning profile for you. (For CLI/CI later, this is the `DEVELOPMENT_TEAM = 8RJXUWMLNF` build setting.)
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

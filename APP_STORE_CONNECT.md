# SCRKPR — App Store Connect Submission Kit

Everything you'll paste/answer in App Store Connect (ASC). The binary upload itself happens from Xcode on your Mac (see `CAPACITOR_iOS.md`); this doc is the rest.

> **Your details:** support email `illudcrab@gmail.com` · support URL `https://scrkpr.base44.app` · copyright `© 2026 Adrian Crabtree` _(change if you want an entity)_. Still TODO: **host the privacy policy** at a public URL (see §6).

---

## 0. Before ASC: accounts & the build

1. **Apple Developer Program** — enroll ($99/yr) at developer.apple.com if you haven't. Required to ship.
2. **Register the App ID** — Developer portal → Identifiers → `com.illudcrab.scrkpr`.
3. **Upload a build** — from Xcode: Product → Archive → Distribute App → App Store Connect (per `CAPACITOR_iOS.md`). The build must finish processing in ASC before you can attach it.

## 1. App information

- **Name:** `SCRKPR` (≤30 chars)
- **Subtitle:** `Keep score for any game` (≤30 chars)
- **Primary category:** Utilities  ·  **Secondary:** Entertainment
  - _(Alternative: "Games" — but that pulls in game-specific review expectations; Utilities fits a scorekeeper better.)_
- **Bundle ID:** `com.illudcrab.scrkpr`
- **Copyright:** `© 2026 Adrian Crabtree`

## 2. Description (paste as-is, or tweak)

```
SCRKPR is the simplest, most delightful way to keep score for any game you play — card games, board games, backyard tournaments, you name it.

No account. No sign-up. No ads. Open it and start keeping score in seconds — everything lives right on your device.

• Add players with their own color and emoji
• Tap to add points — we do the math and crown the leader automatically
• Save your regulars so your crew is one tap away every game
• Multiple win modes — highest score, lowest score, and more
• A running history of every game you finish
• Built for game night: fast, tactile, and a little bit fun

Settle the debate once and for all. We tally the points and keep the receipts.
```

## 3. Promotional text (≤170 chars, editable anytime without review)

```
The simplest way to keep score for game night — no account, no ads, all on your device. Add players, tap to score, crown the leader.
```

## 4. Keywords (≤100 chars, comma-separated, no spaces)

```
scorekeeper,score,game night,card games,board games,points,tally,rummy,cribbage,darts,dominoes
```

## 5. What's New (version notes, v1.0)

```
First release. Keep score for any game — on your device, no account needed.
```

## 6. URLs

- **Support URL (required):** `https://scrkpr.base44.app`
- **Privacy Policy URL (required):** **still needs hosting.** `PRIVACY_POLICY.md` is written (support email already filled in) — publish it at a public URL and paste the link. Easiest options:
  - **GitHub Pages** on the repo (Settings → Pages), then link the rendered page; or
  - if the repo is public, the rendered file URL works: `https://github.com/<you>/SCRKPR/blob/main/PRIVACY_POLICY.md`; or
  - paste it into a free Notion page and "Share to web."
  Apple just needs a reachable URL that shows this text.
- **Marketing URL (optional):** `https://scrkpr.base44.app` or leave blank.

## 7. Screenshots (required)

Provide for **iPhone 6.9"** — `1320 × 2868` (or 6.7" `1290 × 2796`). 1–10 images; 3–5 is a good set. Suggested shots: the FTUE welcome, the live scoreboard with the crown, the Players list with favorites, the End Game hero, the History page.

> **iPad:** Capacitor builds universal (iPhone+iPad) by default, which would require **iPad screenshots too**. For a simpler v1, set the target to **iPhone only** in Xcode (target → General → Supported Destinations, remove iPad). Otherwise prepare iPad 13" `2064 × 2752` screenshots as well.

## 8. App Privacy ("nutrition label")

- **Data collection:** select **"No, we do not collect data from this app."** (Everything is on-device; nothing is transmitted.)
- Result label: **Data Not Collected.**

## 9. Age rating

Answer the questionnaire with **None** across the board → rating **4+**.

## 10. Export compliance (encryption)

The app makes no network calls and uses no non-standard encryption. To skip the per-upload prompt, add to the iOS app's `Info.plist` (in Xcode):

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

In ASC, answer the encryption question accordingly (uses no encryption / exempt).

## 11. Submit

App version → attach the processed **Build** → fill all the above → **Add for Review** → **Submit**. First review typically lands in ~24–48h.

---

### Likely review snags to pre-empt
- **Privacy Policy URL must resolve** — host it before submitting.
- **No "beta/test" placeholder content** in screenshots — use a real-looking game (your seeded players are perfect).
- **Sign-in:** there is none, so no demo account needed — note that in "App Review Information → Notes": _"No account required; all data is stored locally on device."_

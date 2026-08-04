# SCRKPR → Figma migration kit

Prep sheet for porting the app into Figma so colors & spacing can be tweaked as
variables. Two-step plan once the Figma connector is authorized:

1. **`figma-generate-library`** — create the variables below (Color + Number
   modes), so every value lives in one place.
2. **`figma-generate-design`** — rebuild a screen (start with **ScoreBoard**)
   bound to those variables + auto-layout.

Sources of truth in the repo: [`src/index.css`](../src/index.css) (HSL theme
vars) and [`tailwind.config.js`](../tailwind.config.js) (named colors, radius,
fonts).

---

## 1. Color variables

The app **ships dark** (all screenshots are dark; the `.dark` block + the
`prefers-color-scheme` fallback drive it). Build the Figma **Dark** mode from the
hex below. The authored "light" `:root` block is incomplete (it pairs a dark
`--background` with dark text), so treat **Light mode as a TODO**, not a source
of truth — anchor Dark first.

Naming below matches the CSS var so Code Connect can map 1:1 later.

### Theme colors — Dark (primary)

| Variable | Source HSL | Hex | Used for |
|---|---|---|---|
| `background` | `0 0% 7%` | `#121212` | app background |
| `foreground` | `0 0% 93%` | `#EDEDED` | primary text |
| `card` | `220 13% 12%` | `#1B1D23` | cards, sheets, bottom bar |
| `card-foreground` | `0 0% 93%` | `#EDEDED` | text on cards |
| `popover` | `220 13% 12%` | `#1B1D23` | popovers |
| `popover-foreground` | `0 0% 93%` | `#EDEDED` | text on popovers |
| `primary` | `199 94% 57%` | `#2AB7F8` | primary accent (blue) |
| `primary-foreground` | `220 13% 9%` | `#14161A` | text on primary |
| `secondary` | `220 13% 16%` | `#24272E` | secondary surfaces, tab track |
| `secondary-foreground` | `0 0% 80%` | `#CCCCCC` | text on secondary |
| `muted` | `220 13% 16%` | `#24272E` | muted surfaces |
| `muted-foreground` | `0 0% 50%` | `#808080` | secondary/hint text |
| `accent` | `220 13% 18%` | `#282C34` | hover states |
| `accent-foreground` | `0 0% 93%` | `#EDEDED` | text on accent |
| `destructive` | `0 100% 60%` | `#FF3333` | destructive |
| `destructive-foreground` | `0 0% 98%` | `#FAFAFA` | text on destructive |
| `border` | `220 13% 18%` | `#282C34` | borders, dividers |
| `input` | `220 13% 18%` | `#282C34` | input borders |
| `ring` | `199 94% 57%` | `#2AB7F8` | focus ring |

### Brand accents (fixed hex, mode-independent)

| Variable | Hex | Used for |
|---|---|---|
| `accent-blue` | `#2DC5F8` | brand blue (focus borders, primary fills) |
| `accent-red` | `#FF3A3A` | brand red (destructive buttons, "worst" flair) |

> **Player colors are data, not tokens.** Each player picks their own color
> (e.g. `#a21caf`, `#2563eb`, `#e11d48`) at runtime — don't create variables for
> these; in Figma treat player rows as a component with a swappable fill.

---

## 2. Spacing, radius & sizing (Number variables)

Tailwind's 4px scale. The spacings actually used across screens:

| Token | Value | Notes |
|---|---|---|
| `space-1` | 4px | icon gaps |
| `space-2` | 8px | row gaps (`gap-2`), pill padding |
| `space-3` | 12px | |
| `space-4` | 16px | screen h-padding (`px-4`), bottom-bar v-padding |
| `space-5` | 20px | screen h-padding (`px-5`) |
| `space-10` | 40px | top-bar top padding (`pt-10`) |

| Radius | Value | Source |
|---|---|---|
| `radius-sm` | 8px | `calc(var(--radius) - 4px)` |
| `radius-md` | 10px | `calc(var(--radius) - 2px)` |
| `radius-lg` | 12px | `--radius: 0.75rem` |
| `radius-sheet` | 44px | bottom-sheet modals |
| `radius-full` | 9999px | pills, avatars |

| Sizing | Value | Notes |
|---|---|---|
| `touch-min` | 44px | min tap target (`minHeight.touch`) |
| `blur-xs` | 4px | backdrop blur (`backdropBlur.xs`) |
| icon-button | 32×32px | top-bar icons (`w-8 h-8`) |
| tab-height | 36px | segmented tab buttons (`h-9`) |

Safe areas: top uses `env(safe-area-inset-top)`; the bottom action bar fills
`env(safe-area-inset-bottom)` itself (see the recent fix). In Figma, mock these
with a ~34px bottom inset zone.

---

## 3. Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | **Syne** | 600 / 700 / 800 | big titles, winner name, modal titles (`font-display`) |
| Body/UI | **Geist** | 300–800 | everything else (default `body`) |

Both are Google Fonts (imported in `index.css`), so add them as Figma text
styles. Observed sizes → suggested Figma text styles:

| Style | Size / weight | Where |
|---|---|---|
| `eyebrow` | 10–12px, 500, uppercase, `tracking-widest` | section labels ("WINNER", "GAME MODE") |
| `label` | 14px (`text-sm`), 500 | tab labels, bottom-bar buttons (semibold) |
| `body` | 16px (`text-base`), 500–600 | player names, list items |
| `title` | 24px (`text-2xl`), 700, Syne | modal titles, winner name |
| `score` | ~40px+, 700 | the big score numbers |

---

## 4. First screen to stage — ScoreBoard (`/game`)

File: [`src/components/scorekeeper/ScoreBoard.jsx`](../src/components/scorekeeper/ScoreBoard.jsx).
Richest color/spacing surface, so it's the best first port. Section breakdown
with the variables each uses (auto-layout, top→bottom):

1. **Root frame** — fill `background`; top padding = safe-area-top. Vertical
   auto-layout, full-bleed.
2. **Top bar** — h-padding `space-4`, top pad `space-10`, bottom pad 20px.
   - Left: `SCRKPR!` wordmark (Syne, ~120px wide).
   - Right: two 32×32 icon buttons (add-player, reset), gap `space-2`, icons in
     `foreground`.
3. **Segmented tabs** ("Scoreboard / Rounds") — track fill `secondary`, `border`
   stroke, `radius-full`, padding `space-1`; two equal buttons `tab-height`
   (36px); active pill fill `card`; label text `foreground`, inactive
   `muted-foreground`. H-padding `space-5`.
4. **Player rows** (component, repeatable) — full-width bar, `radius-lg`+ (looks
   ~24px), **fill = player color** (data, swappable), gap `space-2` between rows.
   - Avatar circle (emoji) left · name (Geist 600, ~`text-2xl`) · score (bold,
     right-aligned). Text color auto-contrasts to the fill.
   - Optional flair: 👑 crown on the leader; 😭 on "worst" (Swish only).
   Exact radius/padding live in `PlayerColumn.jsx` — the generator will read it.
5. **Bottom action bar** — pinned bottom, fill `card`, top `border` stroke;
   fills the bottom safe-area with `card`. Two equal buttons, each 14px semibold
   `foreground`, v-padding `space-4`, icon (Flag / Bookmark) + label ("End" /
   "Save"). No divider between them.

### Companion pieces worth porting next
- **BottomSheetModal** shell (`radius-sheet` 44px, 8px inset, drag handle) — the
  base for GameMode / Pause / EndGame / confirm dialogs.
- **GameModeModal** — mode list + optional target input (good token coverage).

---

## Handy conversion note
HSL → hex was computed for Dark mode above. If you re-theme in code later, the
hex here drifts — regenerate from `index.css`. (Figma variables can also store
HSL directly if you'd rather keep parity with the CSS authoring format.)

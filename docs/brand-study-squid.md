# Squid Router Brand Study — Ground Truth

> **Purpose**: Authoritative reference for Qupay's design system, sourced directly
> from Squid Router's production CSS variables (inline `--st-*` tokens on
> `app.squidrouter.com`, captured April 2026) and marketing-site markup. Every
> value is verbatim; nothing is triangulated from screenshots.

---

## 1. Palette

### 1.1 Neutrals — "grey" ramp

Warm-cool near-black through off-white. Ships as `data-squid-theme-type="dark"`.

| Token | CSS variable | Hex | Role |
|-------|-------------|-----|------|
| grey-900 | `--st-color-grey-900` | `#17191C` | App bg, input bg, primary surface |
| grey-800 | `--st-color-grey-800` | `#292C32` | Tertiary button bg, raised panels, dividers |
| grey-700 | `--st-color-grey-700` | `#4C515D` | Borders, disabled text |
| grey-600 | `--st-color-grey-600` | `#676B7E` | Placeholder text, muted icons |
| grey-500 | `--st-color-grey-500` | `#8A8FA8` | Muted labels |
| grey-400 | `--st-color-grey-400` | `#A7ABBE` | Secondary text |
| grey-300 | `--st-color-grey-300` | `#D1D6E0` | Body text on dark, input text |
| grey-200 | `--st-color-grey-200` | `#EDEFF3` | Soft on light surfaces |
| grey-100 | `--st-color-grey-100` | `#FBFBFD` | Off-white; secondary button bg on dark |

### 1.2 Brand — "royal" ramp

The single brand hue. A muted, cool purple — NOT saturated electric violet.

| Token | CSS variable | Hex | Role |
|-------|-------------|-----|------|
| royal-300 | `--st-color-royal-300` | `#D9BEF4` | Hover, soft lavender |
| royal-400 | `--st-color-royal-400` | `#B893EC` | Light brand accent, secondary fills |
| royal-500 | `--st-color-royal-500` | `#9E79D2` | **Primary CTA, progress, animation bg** |
| royal-600 | `--st-color-royal-600` | `#8353C5` | Pressed / deep CTA |
| royal-700 | `--st-color-royal-700` | `#6B45A1` | Deepest; chart anchors |

### 1.3 Status

| Token | CSS variable | Hex | Role |
|-------|-------------|-----|------|
| status-positive | `--st-color-status-positive` | `#7AE870` | Success, received, positive delta |
| status-partial | `--st-color-status-partial` | `#F3AF25` | Warning, pending, awaiting solver |
| status-negative | `--st-color-status-negative` | `#FF4D5B` | Error, failed, cancelled |

### 1.4 Highlight

| Token | CSS variable | Hex | Role |
|-------|-------------|-----|------|
| highlight-700 | `--st-color-highlight-700` | `#E4FE53` | Squid mascot accent only |

Squid reserves this acid lime for the mascot logo mark and the occasional
celebratory sparkle. It is never a surface, never a CTA, never body text.

**Qupay substitution**: `#F3C23D` amber — used for the `q` monogram accent dot
and the one-shot success-burst. No other usage.

### 1.5 Material (frosted-glass overlays)

| Token | CSS variable | Value | Role |
|-------|-------------|-------|------|
| material-light-thin | `--st-color-material-light-thin` | `#FBFBFD1A` (10%) | Hairline borders on dark cards |
| material-light-average | `--st-color-material-light-average` | `#FBFBFD54` (33%) | Subtle dividers |
| material-light-thick | `--st-color-material-light-thick` | `#FBFBFDA8` (66%) | Glass surfaces |
| material-dark-thin | `--st-color-material-dark-thin` | `#17191C1A` (10%) | Light-mode hairline borders |
| material-dark-average | `--st-color-material-dark-average` | `#17191C54` (33%) | Light-mode dividers |
| material-dark-thick | `--st-color-material-dark-thick` | `#17191CA8` (66%) | Light-mode glass surfaces |
| menu-bg | `--st-color-menu-bg` | `#17191CA8` | Dropdown bg (dark @ 66%) |
| menu-text | `--st-color-menu-text` | `#FBFBFDA8` | Dropdown text |
| menu-backdrop | `--st-color-menu-backdrop` | `#FBFBFD1A` | Dropdown border |
| modal-backdrop | `--st-color-modal-backdrop` | `#17191C54` | Modal scrim (33%) |

### 1.6 Button tokens

| Size | Variant | Background | Text |
|------|---------|-----------|------|
| lg/md/sm | primary | `#9E79D2` (royal-500) | `#FBFBFD` |
| lg/md/sm | secondary | `#FBFBFD` (grey-100) | `#292C32` |
| lg/md/sm | tertiary | `#292C32` (grey-800) | `#D1D6E0` |

All tertiary buttons have a `material-light-thin` (10% white) border.

### 1.7 Input tokens

| Token | Value |
|-------|-------|
| bg | `#17191C` (grey-900 — same as page) |
| placeholder | `#676B7E` (grey-600) |
| text | `#D1D6E0` (grey-300) |
| selection | `#D1D6E0` (grey-300) |

### 1.8 Animation tokens

| Token | Value |
|-------|-------|
| bg | `#9E79D2` (royal-500) |
| text | `#FBFBFD` (grey-100) |

### 1.9 Qupay marketing backdrop (Qupay-native, not Squid)

| Token | Value | Role |
|-------|-------|------|
| mural-ground | `#2A2438` | Full-bleed bg behind auth/splash/success |
| mural-foreground | `#6E5A8F` | Wire-lattice silhouette fill |

---

## 2. Typography

### 2.1 Typeface

Squid uses **GeistVariable** (Vercel's Geist), fallback `sans-serif`.

```css
--st-font-family-squid-main: GeistVariable, sans-serif;
```

**Qupay**: Install `@expo-google-fonts/geist` (~320KB).

### 2.2 Weights

All weights ship at **400**. Visual hierarchy is achieved through size and
color, not weight.

```css
--st-font-weight-caption: 400;
--st-font-weight-body-small: 400;
--st-font-weight-body-medium: 400;
--st-font-weight-body-large: 400;
--st-font-weight-heading-small: 400;
--st-font-weight-heading-medium: 400;
--st-font-weight-heading-large: 400;
```

### 2.3 Size scale (rem → px at 16px root)

| Role | CSS variable | rem | px |
|------|-------------|-----|-----|
| caption | `--st-font-size-caption` | 0.875 | 14 |
| body-small | `--st-font-size-body-small` | 1.14375 | 18.3 |
| body-medium | `--st-font-size-body-medium` | 1.40625 | 22.5 |
| body-large | `--st-font-size-body-large` | 1.75625 | 28.1 |
| heading-small | `--st-font-size-heading-small` | 2.1875 | 35 |
| heading-medium | `--st-font-size-heading-medium` | 3.08125 | 49.3 |
| heading-large | `--st-font-size-heading-large` | 4.40625 | 70.5 |

### 2.4 Qupay adjustments

- Load Geist Variable at 400 only.
- Letter-spacing: tight on display (-0.02em), neutral elsewhere (0).
- `fontVariant: ['tabular-nums']` on all value/amount variants (essential for
  the odometer animation and stat alignment).

---

## 3. Radii

| Token | CSS variable | rem | px | Usage |
|-------|-------------|-----|-----|-------|
| button-lg | `--st-border-radius-button-lg-*` | 3.75 | 60 | Hero CTA (pill) |
| button-md / button-sm | `--st-border-radius-button-md-*` | 1.25 | 20 | Inline buttons |
| container | `--st-border-radius-container` | 1.875 | 30 | Cards, panels, main surface |
| modal | `--st-border-radius-modal` | 1.875 | 30 | Modal sheets |
| input | `--st-border-radius-input` | 9999px | pill | Inputs, chips |
| menu-lg | `--st-border-radius-menu-lg` | 1.25 | 20 | Dropdowns (large) |
| menu-sm | `--st-border-radius-menu-sm` | 0.9375 | 15 | Dropdowns (small) |

Heuristic: inputs/chips → full pill; cards → 30; buttons → 60 (large) or 20
(inline); nothing is sharp-cornered.

---

## 4. Elevation

### 4.1 Canonical shadow

```css
--st-box-shadow-container: 0px 2px 4px 0px rgba(0,0,0,0.20),
                           0px 5px 50px -1px rgba(0,0,0,0.33);
```

Tight catch-light + 50px ambient bloom. One shadow. No layered elevation
scale. Used in light mode only.

### 4.2 Dark-mode surface separation

Squid relies on `material-light-thin` (`#FBFBFD1A`, 10% white) hairlines
instead of shadows. Cards on dark have a `1px outline` or `border` at this
value, plus the container's `outline-material-light-thin` class.

---

## 5. Marketing-site backdrop

### 5.1 App vs marketing

- **App** (`app.squidrouter.com`): flat `grey-900` (#17191C). No backdrop
  motif, no gradient, no blur.
- **Marketing** (`squidrouter.com`): tentacle-mural SVG on a `#36334C` ground
  in `#7F659D` fill. The tentacle paths (five stylised S-curves from the mascot
  icon) render at full bleed, `pointer-events-none`, `scale-110`, hidden on
  mobile.

### 5.2 Qupay interpretation

Qupay adopts the **same structural idea** — a single-color SVG mural on a
dark ground — with a Qupay-native subject: a currency-corridor wire lattice
(arcing routes connecting continental anchors, suggesting "value in motion
between places"). Colors: `#2A2438` ground, `#6E5A8F` fill.

Used on: Splash, SignIn, SignUp, Success.

NOT used on: any product screen (Portfolio, Send, Tracking, Settings). Those
are flat `grey-900`.

---

## 6. Component specs (from live CSS)

### 6.1 Primary button (button-lg-primary)

- bg `#9E79D2`, text `#FBFBFD`, radius 60px (pill)
- No border, no shadow at rest
- 1px `material-light-thin` border on tertiary variant only

### 6.2 Secondary button (button-lg-secondary)

- bg `#FBFBFD`, text `#292C32`, radius 60px
- Used for "Connect Wallet" type actions

### 6.3 Tertiary button (button-lg-tertiary)

- bg `#292C32`, text `#D1D6E0`, radius 60px
- 1px `material-light-thin` border
- Used for chain/token pickers, period selectors

### 6.4 Input

- bg `#17191C` (grey-900 — same as page)
- Radius 9999px (full pill)
- Placeholder `#676B7E`, text `#D1D6E0`

### 6.5 Modal

- Radius 30px, backdrop `#17191C54` (33% dark, not blurred)

### 6.6 Menu / dropdown

- bg `#17191CA8` (dark glass), text `#FBFBFDA8`
- Menu border `#FBFBFD1A` (material-light-thin hairline)
- Radius 15–20px

---

## 7. Motion

### 7.1 Signature patterns

| Pattern | Description | Source |
|---------|------------|--------|
| Odometer digit-roll | Hero numerics use vertical-stack digits (`0…9`) that `translateY` per column; ~300ms ease-out, 20ms stagger per digit | app.squidrouter.com hero |
| Purple progress sweep | Animation bg `#9E79D2` sweeping left-to-right during swap execution; ~600ms single-shot | app.squidrouter.com swap progress |
| Solver-auction pulse | Radial `royal-500` pulse (opacity 0.12 → 0 over 1.4s, repeating) behind the status line during route matching | Conceptual; app execution indicator |
| Corridor wire draw | SVG stroke-dashoffset from length→0 on mount; `royal-500` traveled, `grey-700` remaining, `royal-300` bead at leading edge | Qupay-specific; inspired by Squid route animation |
| Button press | 0.97 scale spring + haptic | app.squidrouter.com interactions |

### 7.2 Reduce motion

All animations respect `AccessibilityInfo.isReduceMotionEnabled`:

- Replace spring/tween with instant state
- Disable odometer roll; show final number immediately
- Disable pulse loops; show static state
- Disable stroke-draw; show fully-drawn wire

---

## 8. Iconography

- Library: `lucide-react-native` (already installed)
- Stroke width: 1.5px, rounded caps/joins, 24px grid
- Fill: outline only in primary UI
- Chain/country avatars: circular with `material-light-thin` ring on dark

---

## 9. Illustration vocabulary

### 9.1 Ground truth

Squid does **not** use 3D-rendered "matte plastic" illustrations. Everything on
the marketing site and app is flat SVG:

- Single-color silhouettes (tentacle mural)
- Flat chain/token logos (round, brand-colored)
- No raster, no gradients on illustrations, no photographic elements

### 9.2 Qupay approach

- Flat SVG, single-line-weight strokes
- One accent color max per illustration (`royal-400` on `grey-700` base)
- Rounded geometry matching icon vocabulary
- Never photorealistic, never 3D

---

## 10. Copy voice

- **Tone**: Short, declarative, benefit-first. "The whole of crypto, connected."
- **Stats**: Stat-stack pattern — "$6b+ safely routed / 1M+ users / 100+ chains"
- **Headlines**: lowercase casual mixed with ALL-CAPS stat blocks
- **CTAs**: Imperative single-word or two-word verbs — "Swap", "Bridge", "Confirm", "Done"
- **Success**: Terse celebration — "Swap complete."
- **Error**: Clear and actionable — "Insufficient balance. Deposit funds."

Qupay adaptation:
- "Send" / "Continue" / "Confirm" / "Done"
- Success: "Cash on the way." / "Sent."
- Error: Actionable, no jargon.

---

## 11. Logo system

### 11.1 Squid's marks (DO NOT REPRODUCE)

- **Wordmark**: "squid" in a custom inky rounded-lowercase
- **Icon**: interlocking S-curve (mirrored tentacles)
- Shipped in Yellow (#E4FE53), Purple (#9E79D2), Black, White
- Assets at: `github.com/0xsquid/assets/squid-brand-assets/`

### 11.2 Qupay mark direction

- Redraw a lowercase `q` monogram
- Single-color fill: `royal-500` primary variant
- `#F3C23D` amber accent dot (the Qupay highlight, not Squid's lime)
- Additional variants: white, black
- Rounded geometric vocabulary; thick uniform strokes
- Separate wordmark: "qupay" in Geist at 400, custom optical kerning

---

## 12. IP safety boundaries

- YES: Adopt design tokens, radii, shadow, material-hairline treatment, type
  strategy, flat-SVG illustration rigor, odometer pattern, purple-as-primary.
- NO: Squid's tentacle SVG paths, squid icon/wordmark, "Powered by Squid"
  lockup, `#E4FE53` as any Qupay brand color, any raster screenshot in bundle.

---

## 13. Sources

| Source | URL | Data extracted |
|--------|-----|---------------|
| App (inline CSS vars) | app.squidrouter.com | Full `--st-*` token set (palette, radii, shadows, typography, button/input/menu/modal tokens) |
| Marketing site (HTML) | squidrouter.com | Backdrop SVG paths, preloaded fonts, SEO markup, copy voice |
| Widget Studio | studio.squidrouter.com | Token taxonomy (accent, foreground, background, button, input, animation, tooltip structure) |
| Docs | docs.squidrouter.com | Copy voice, technical terminology, widget customization guide |
| Brand Assets | docs.squidrouter.com/additional-resources/brand-assets | Official logo variants (Yellow, Purple, Black, White) in SVG + PNG |
| GitHub | github.com/0xsquid/assets/squid-brand-assets | Asset repository structure |

---

*Document prepared for Phase A gate review. All values sourced from production
code, not screenshots.*

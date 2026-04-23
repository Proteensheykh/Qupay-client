# Qupay Moodboard — Corrected

> **Purpose**: Visual reference anchors for the Qupay rebrand. Each entry
> describes what to observe and why it matters. All references are live URLs;
> no redistributed assets.

---

## 1. Surface treatment

### 1.1 App surfaces (flat dark)

- **Reference**: [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: Background is flat `#17191C` (grey-900). Cards are also
  `#17191C` with a 1px `rgba(251,251,253,0.10)` hairline border. No drop
  shadows on dark. No gradients on surfaces.
- **Qupay takeaway**: Every product screen (Portfolio, Send flow, Tracking,
  Settings) uses flat grey-900 with hairline separation. No ambient gradients,
  no glows, no blurred blobs.

### 1.2 Marketing surfaces (mural backdrop)

- **Reference**: [squidrouter.com](https://squidrouter.com/) (inspect
  background on tablet+ viewport)
- **Observe**: A full-bleed SVG of five stylised tentacle paths drawn in
  `#7F659D` on a `#36334C` ground. `pointer-events-none`, `scale-110`,
  `preserveAspectRatio="xMidYMid slice"`. Hidden on mobile.
- **Qupay takeaway**: Splash, SignIn, SignUp, and Success screens use a
  single-color SVG mural (currency-corridor wire lattice, `#6E5A8F` on
  `#2A2438`). All other screens are flat grey-900.

### 1.3 Light mode surfaces

- **Reference**: Squid ships dark-only; `theme-color` meta for light is
  `#FBFBFD`.
- **Qupay takeaway**: Light mode bg = `#FBFBFD` (grey-100), cards = white
  with `rgba(23,25,28,0.10)` hairline + canonical shadow. Mirror structure,
  invert polarity.

---

## 2. Color

### 2.1 Primary brand purple

- **Reference**: `--st-color-royal-500: #9E79D2` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: Used on every primary button, progress bar, and animation
  background. Muted, not saturated.
- **Qupay takeaway**: `royal-500` is the single brand color. No mint, no
  electric violet, no magenta.

### 2.2 Neutral grey ramp

- **Reference**: `--st-color-grey-100` through `--st-color-grey-900` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: 9-step ramp from `#FBFBFD` to `#17191C`. Text hierarchy
  achieved by stepping through grey-300 (body), grey-500 (muted), grey-600
  (placeholder).
- **Qupay takeaway**: Adopt this ramp verbatim.

### 2.3 Status triad

- **Reference**: `--st-color-status-*` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: green `#7AE870`, amber `#F3AF25`, red `#FF4D5B`. Used on
  badges, deltas, and inline indicators.
- **Qupay takeaway**: Adopt verbatim.

### 2.4 Highlight (mascot-only)

- **Reference**: `--st-color-highlight-700: #E4FE53`
- **Observe**: Acid lime. Only appears on the squid mascot icon logo.
- **Qupay takeaway**: Replace with `#F3C23D` amber. Reserved for
  monogram accent dot and success-burst. Never general UI.

---

## 3. Typography

### 3.1 Geist at 400

- **Reference**: `--st-font-family-squid-main: GeistVariable, sans-serif;`
  and all `--st-font-weight-*: 400` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: Every text element — caption through heading-large — is
  weight 400. Hierarchy comes from size and color, never weight.
- **Qupay takeaway**: Load Geist Variable at 400 only. Drop all bold/semibold
  usage. Display text is large (70.5px heading-large) but light-weight.

### 3.2 Odometer numerics

- **Reference**: Hero on [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: The "Pay" and "Receive" amounts render as vertical digit stacks
  (`00123456789` strings) that scroll per-column on value change.
- **Qupay takeaway**: Implement `Odometer` component for AmountScreen and
  PortfolioScreen balance. `fontVariant: ['tabular-nums']` mandatory.

---

## 4. Radii

- **Reference**: `--st-border-radius-*` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: inputs/chips = pill (9999px); cards = 30px; buttons = 60px
  (large) or 20px (inline); menus = 15–20px. Nothing sharp-cornered.
- **Qupay takeaway**: Five-step scale: `sm 15 / md 20 / lg 30 / xl 60 /
  pill 9999`.

---

## 5. Elevation

- **Reference**: `--st-box-shadow-container` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: One shadow: `0 2px 4px rgba(0,0,0,0.20), 0 5px 50px -1px
  rgba(0,0,0,0.33)`. Used on the main card container. Dark-mode cards use
  hairline borders instead.
- **Qupay takeaway**: One shadow (light only), hairlines (dark only). No
  mint/brand-colored glow on anything.

---

## 6. Buttons

- **Reference**: `--st-color-button-lg-*` on
  [app.squidrouter.com](https://app.squidrouter.com/)
- **Observe**: Three variants — primary (purple fill), secondary (white fill),
  tertiary (grey-800 fill + hairline). All use 60px radius (large) or 20px
  (inline). Text is grey-100 / grey-800 / grey-300 respectively.
- **Qupay takeaway**: Match these three button types exactly. No gradient
  fills on buttons. The "gradient button" concept is retired.

---

## 7. Illustration vocabulary

### 7.1 Flat SVG only

- **Reference**: [squidrouter.com](https://squidrouter.com/) hero section
  and backdrop
- **Observe**: Everything is flat SVG. No 3D renders, no matte plastic, no
  specular highlights, no raster imagery, no photography. Single-color
  silhouettes for the backdrop mural. Flat round logos for chain icons.
- **Qupay takeaway**: All illustrations are flat SVG with one accent color
  max. Rounded geometry. Single-line-weight strokes where applicable.

### 7.2 NOT 3D

The previous Qupay moodboard incorrectly described Squid's illustration
style as "matte plastic 3D". This was wrong. Squid uses no 3D of any kind.
All Qupay assets must be flat SVG.

---

## 8. Motion

### 8.1 Signature patterns

- **Odometer digit-roll**: vertical scroll per digit, ~300ms ease-out, 20ms
  stagger. THE signature Squid motion.
- **Purple progress sweep**: `royal-500` fills left-to-right during execution.
- **Button press**: 0.97 scale spring + haptic.

### 8.2 Qupay-native motion

- **Solver-auction pulse**: radial `royal-500` at 12% opacity, 1.4s loop.
  Behind status lines on DepositWaiting/Tracking.
- **Corridor wire draw**: SVG stroke-dashoffset animation. `royal-500`
  traveled, `grey-700` remaining, `royal-300` bead at leading edge.

### 8.3 Anti-patterns (retired from previous attempt)

- No mint-colored shimmer
- No "glow bloom" on buttons (no `ctaGlow` shadow)
- No gradient-animated borders

---

## 9. Logo

- **Squid's marks**: DO NOT REPRODUCE — tentacle S-curve icon, "squid"
  wordmark, acid lime mascot color
- **Qupay mark**: lowercase `q` monogram, single `royal-500` fill,
  `#F3C23D` amber accent dot, rounded geometric strokes
- **Qupay wordmark**: "qupay" in Geist at 400, custom optical kerning,
  single-color

---

## 10. Copy voice

- Short, declarative, benefit-first
- Imperative single-word CTAs: "Send" / "Continue" / "Confirm" / "Done"
- Success: "Cash on the way." / "Sent."
- Stats in stacks: "$X safely routed / Y users / Z corridors"
- No jargon in primary UI; technical terms in secondary rows only

---

*All references are live as of April 2026.*

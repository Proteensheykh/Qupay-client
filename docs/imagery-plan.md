# Qupay Imagery Plan — Corrected

---

## Design Principles

1. **No Squid IP** — Never use Squid Router's illustrations, tentacle SVG paths, or brand marks. All assets must be original.
2. **Flat SVG only** — No 3D renders, no matte plastic materials, no raster imagery, no photography. Single-color or two-color silhouettes.
3. **One accent max** — Each illustration uses at most one accent color (`royal-400` or `highlight`) on a `grey-700` base.
4. **Performance** — SVG preferred. Lottie only when motion is essential and SVG can't express it. Keep Lottie < 50KB.
5. **Accessibility** — Decorative images: empty `accessibilityLabel` or `aria-hidden`. Meaningful images: descriptive labels.

---

## Asset Inventory

### Brand assets (`assets/brand/`)

| File | Description | Colors |
|------|-------------|--------|
| `mural.svg` | Full-bleed wire-lattice backdrop (1800x900) | `#6E5A8F` silhouette on transparent; host applies `#2A2438` ground |
| `q-mark-royal.svg` | Q monogram, primary variant | `#9E79D2` fill, `#F3C23D` accent dot |
| `q-mark-white.svg` | Q monogram, white variant | `#FBFBFD` fill, `#F3C23D` accent dot |
| `q-mark-black.svg` | Q monogram, black variant | `#17191C` fill, `#F3C23D` accent dot |
| `q-mark-highlight.svg` | Q monogram, amber variant | `#F3C23D` fill, `#9E79D2` accent dot |
| `qupay-wordmark.svg` | "qupay" wordmark | `#9E79D2` text, `#F3C23D` descender dot |
| `success-burst.svg` | Concentric arcs + checkmark | `#9E79D2` arcs, `#F3C23D` check |

### Illustration assets (`assets/illustrations/`)

| File | Description | Colors |
|------|-------------|--------|
| `empty-history.svg` | Clock + text lines (history empty state) | `#4C515D` base, `#B893EC` accent |
| `empty-stream.svg` | Inbox + arrow (stream empty state) | `#4C515D` base, `#B893EC` accent |

---

## Imagery Slots by Screen

### Splash / Auth screens
- **Backdrop**: `MuralBackdrop` component renders `mural.svg` over `#2A2438`
- **Logo**: `QupayLogo` component (`q-mark-royal.svg` equivalent, rendered in code)
- **Progress**: code-driven royal-500 sweep (no Lottie needed)

### Amount Screen
- Currency icons: flag emoji (future: flat circular SVG flags)
- No hero illustration

### Recipient Screen
- Contact avatars: `GradientAvatar` component (solid royal-700, code-driven)
- No illustrations

### Confirm Screen
- No illustrations; layout is pure cards + typography

### Deposit Waiting
- `SolverPulse` component (code-driven radial pulse)
- QR frame: code-drawn border (no illustration needed)

### Tracking Screen
- `CorridorWire` component (code-driven SVG + animation)
- No static illustrations

### Success Screen
- `MuralBackdrop` for celebratory context
- Success disc: code-driven royal-500 circle + check
- Optional: `success-burst.svg` as a static decorative layer behind the disc

### Portfolio / History
- Empty state: `empty-history.svg`
- Asset rows: chain token logos (round, flat, brand-colored — sourced from APIs)

### Transaction Stream
- Empty state: `empty-stream.svg`
- Live indicator: code-driven pulsing dot

### Settings
- Profile avatar: `GradientAvatar` component
- Section icons: Lucide (stroke icons, already installed)

### Processor Onboarding
- Stepper: code-driven pill segments
- No hero illustration

---

## Retired Concepts

The following imagery concepts from the previous plan are **retired**:

- Lottie `splash-loader.json` (replaced by code-driven purple sweep)
- Lottie `marching-ants.json` (replaced by code-driven `SolverPulse`)
- Lottie `success-confetti.json` (replaced by code-driven disc + `success-burst.svg`)
- SVG `auth-arc.svg` (replaced by `MuralBackdrop`)
- SVG `secure-lock.svg` (Lucide icons suffice)
- SVG `processor-onboard.svg` (unnecessary; stepper is code-driven)
- All 3D matte-plastic asset references
- All mint→violet gradient illustrations
- All `#23F7DD` / `#7A5CFF` / `#FF5CA8` color references in assets

---

## Color Reference for New Assets

When creating additional assets, use these exact values:

```
Royal 500 (primary):    #9E79D2
Royal 400 (accent):     #B893EC
Royal 300 (soft):       #D9BEF4
Grey 700 (base):        #4C515D
Grey 900 (dark bg):     #17191C
Highlight (amber):      #F3C23D
Mural foreground:       #6E5A8F
Mural ground:           #2A2438
Status positive:        #7AE870
Status partial:         #F3AF25
Status negative:        #FF4D5B
```

---

*Updated for the corrected Squid-true rebrand. All assets are flat SVG.*

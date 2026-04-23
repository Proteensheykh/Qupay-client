# Tokens Diff: Squid CSS Variables → Qupay Semantic Tokens

> Every `--st-*` CSS variable from `app.squidrouter.com` mapped to a Qupay
> design token, with disposition (adopt / translate / reject) and reasoning.

---

## Neutrals

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-grey-900` | `#17191C` | `palette.grey.900` / `dark.background.primary` | `#17191C` | adopt | Direct match |
| `--st-color-grey-800` | `#292C32` | `palette.grey.800` / `dark.background.raised` | `#292C32` | adopt | Direct match |
| `--st-color-grey-700` | `#4C515D` | `palette.grey.700` / `border.default` | `#4C515D` | adopt | Direct match |
| `--st-color-grey-600` | `#676B7E` | `palette.grey.600` / `text.placeholder` | `#676B7E` | adopt | Direct match |
| `--st-color-grey-500` | `#8A8FA8` | `palette.grey.500` / `text.muted` | `#8A8FA8` | adopt | Direct match |
| `--st-color-grey-400` | `#A7ABBE` | `palette.grey.400` / `text.secondary` | `#A7ABBE` | adopt | Direct match |
| `--st-color-grey-300` | `#D1D6E0` | `palette.grey.300` / `dark.text.primary` | `#D1D6E0` | adopt | Direct match |
| `--st-color-grey-200` | `#EDEFF3` | `palette.grey.200` / `light.text.secondary` | `#EDEFF3` | adopt | Direct match |
| `--st-color-grey-100` | `#FBFBFD` | `palette.grey.100` / `light.background.primary` | `#FBFBFD` | adopt | Direct match |
| `--st-color-grey-100-005` | `#FBFBFD0D` | — | — | reject | Ultra-subtle variant; not needed |

## Brand (Royal)

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-royal-300` | `#D9BEF4` | `palette.royal.300` / `brand.primarySoft` | `#D9BEF4` | adopt | Direct match |
| `--st-color-royal-400` | `#B893EC` | `palette.royal.400` / `brand.primaryLight` | `#B893EC` | adopt | Direct match |
| `--st-color-royal-500` | `#9E79D2` | `palette.royal.500` / `brand.primary` | `#9E79D2` | adopt | THE brand color |
| `--st-color-royal-600` | `#8353C5` | `palette.royal.600` / `brand.primaryPressed` | `#8353C5` | adopt | Direct match |
| `--st-color-royal-700` | `#6B45A1` | `palette.royal.700` / `brand.primaryDeep` | `#6B45A1` | adopt | Direct match |

## Status

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-status-positive` | `#7AE870` | `feedback.success` | `#7AE870` | adopt | Direct match |
| `--st-color-status-partial` | `#F3AF25` | `feedback.warning` | `#F3AF25` | adopt | Direct match |
| `--st-color-status-negative` | `#FF4D5B` | `feedback.danger` | `#FF4D5B` | adopt | Direct match |

## Highlight

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-highlight-700` | `#E4FE53` | `accent.highlight` | `#F3C23D` | translate | Squid's lime reads as their mascot; Qupay substitutes amber for monogram/success-burst only |

## Material

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-material-light-thin` | `#FBFBFD1A` | `material.lightThin` / `borders.hairline.dark` | `rgba(251,251,253,0.10)` | adopt | Hairline borders on dark |
| `--st-color-material-light-average` | `#FBFBFD54` | `material.lightAverage` | `rgba(251,251,253,0.33)` | adopt | Subtle dividers |
| `--st-color-material-light-thick` | `#FBFBFDA8` | `material.lightThick` | `rgba(251,251,253,0.66)` | adopt | Glass surfaces |
| `--st-color-material-dark-thin` | `#17191C1A` | `material.darkThin` / `borders.hairline.light` | `rgba(23,25,28,0.10)` | adopt | Light-mode hairlines |
| `--st-color-material-dark-average` | `#17191C54` | `material.darkAverage` | `rgba(23,25,28,0.33)` | adopt | Light-mode dividers |
| `--st-color-material-dark-thick` | `#17191CA8` | `material.darkThick` | `rgba(23,25,28,0.66)` | adopt | Light-mode glass surfaces |

## Menus & modals

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-menu-bg` | `#17191CA8` | `menu.background` | `rgba(23,25,28,0.66)` | adopt | Dropdown bg |
| `--st-color-menu-text` | `#FBFBFDA8` | `menu.text` | `rgba(251,251,253,0.66)` | adopt | Dropdown text |
| `--st-color-menu-backdrop` | `#FBFBFD1A` | `menu.border` | `rgba(251,251,253,0.10)` | adopt | Dropdown hairline |
| `--st-color-modal-backdrop` | `#17191C54` | `modal.backdrop` | `rgba(23,25,28,0.33)` | adopt | Modal scrim |

## Buttons

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-button-lg-primary-bg` | `#9E79D2` | `button.primary.bg` | `#9E79D2` | adopt | Direct match |
| `--st-color-button-lg-primary-text` | `#FBFBFD` | `button.primary.text` | `#FBFBFD` | adopt | Direct match |
| `--st-color-button-lg-secondary-bg` | `#FBFBFD` | `button.secondary.bg` | `#FBFBFD` | adopt | Direct match |
| `--st-color-button-lg-secondary-text` | `#292C32` | `button.secondary.text` | `#292C32` | adopt | Direct match |
| `--st-color-button-lg-tertiary-bg` | `#292C32` | `button.tertiary.bg` | `#292C32` | adopt | Direct match |
| `--st-color-button-lg-tertiary-text` | `#D1D6E0` | `button.tertiary.text` | `#D1D6E0` | adopt | Direct match |

## Inputs

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-input-bg` | `#17191C` | `input.bg` | `#17191C` | adopt | Same as page bg |
| `--st-color-input-placeholder` | `#676B7E` | `input.placeholder` | `#676B7E` | adopt | Direct match |
| `--st-color-input-text` | `#D1D6E0` | `input.text` | `#D1D6E0` | adopt | Direct match |
| `--st-color-input-selection` | `#D1D6E0` | `input.selection` | `#D1D6E0` | adopt | Direct match |

## Animation

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-color-animation-bg` | `#9E79D2` | `animation.bg` | `#9E79D2` | adopt | Purple sweep bg |
| `--st-color-animation-text` | `#FBFBFD` | `animation.text` | `#FBFBFD` | adopt | Text during animation |

## Typography

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-font-family-squid-main` | `GeistVariable, sans-serif` | `fontFamily.primary` | `Geist_400Regular` | adopt | Load via @expo-google-fonts/geist |
| `--st-font-weight-*` | `400` (all) | `fontWeight.*` | `400` (all) | adopt | Hierarchy via size, not weight |
| `--st-font-size-caption` | `0.875rem` (14px) | `typography.caption.fontSize` | `14` | adopt | Direct match |
| `--st-font-size-body-small` | `1.14375rem` (18.3px) | `typography.bodySmall.fontSize` | `18` | adopt | Rounded for RN |
| `--st-font-size-body-medium` | `1.40625rem` (22.5px) | `typography.bodyMedium.fontSize` | `22` | adopt | Rounded for RN |
| `--st-font-size-body-large` | `1.75625rem` (28.1px) | `typography.bodyLarge.fontSize` | `28` | adopt | Rounded for RN |
| `--st-font-size-heading-small` | `2.1875rem` (35px) | `typography.headingSmall.fontSize` | `35` | adopt | Direct match |
| `--st-font-size-heading-medium` | `3.08125rem` (49.3px) | `typography.headingMedium.fontSize` | `49` | adopt | Rounded for RN |
| `--st-font-size-heading-large` | `4.40625rem` (70.5px) | `typography.headingLarge.fontSize` | `70` | adopt | Rounded for RN |

## Radii

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-border-radius-button-lg-*` | `3.75rem` (60px) | `radii.xl` | `60` | adopt | Pill CTAs |
| `--st-border-radius-button-md-*` | `1.25rem` (20px) | `radii.md` | `20` | adopt | Inline buttons |
| `--st-border-radius-button-sm-*` | `1.25rem` (20px) | `radii.md` | `20` | adopt | Same as md |
| `--st-border-radius-container` | `1.875rem` (30px) | `radii.lg` | `30` | adopt | Cards, panels |
| `--st-border-radius-modal` | `1.875rem` (30px) | `radii.lg` | `30` | adopt | Same as container |
| `--st-border-radius-input` | `9999px` | `radii.pill` | `9999` | adopt | Full pill |
| `--st-border-radius-menu-lg` | `1.25rem` (20px) | `radii.md` | `20` | adopt | Maps to md |
| `--st-border-radius-menu-sm` | `0.9375rem` (15px) | `radii.sm` | `15` | adopt | Smallest canonical step |

## Shadow

| Squid variable | Squid value | Qupay token | Qupay value | Disposition | Reasoning |
|---------------|-------------|-------------|-------------|-------------|-----------|
| `--st-box-shadow-container` | `0 2px 4px rgba(0,0,0,0.20), 0 5px 50px -1px rgba(0,0,0,0.33)` | `shadow.container` | same | adopt | Light mode only |

## Qupay-only additions (no Squid equivalent)

| Qupay token | Value | Reasoning |
|-------------|-------|-----------|
| `accent.highlight` | `#F3C23D` | Qupay amber; replaces Squid's `#E4FE53` |
| `marketing.ground` | `#2A2438` | Mural ground; Squid's `#36334C` adapted darker for distinction |
| `marketing.muralFg` | `#6E5A8F` | Mural silhouette fill; luminance-matched |
| `gradient.shimmer` | `grey-800 → grey-700 → grey-800` | Skeleton loading; Squid's was mint-tinted |
| `gradient.corridor` | `royal-500 → royal-300` | Qupay send-corridor visualization |
| `gradient.celebrate` | `royal-500 → highlight @ 40%` | One-shot success wash |

---

*Generated from app.squidrouter.com inline CSS variables, April 2026.*

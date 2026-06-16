/**
 * Qupay border radius tokens — sourced from Squid Router CSS variables
 *
 * Five canonical steps matching --st-border-radius-* values.
 */

export const radii = {
  /** 12px — buttons, inputs, chips (light-theme facelift) */
  xs: 12,

  /** 15px — small menus, dropdown items */
  sm: 15,

  /** 16px — cards & list containers (light-theme facelift) */
  card: 16,

  /** 20px — inline buttons (md/sm), menu-lg */
  md: 20,

  /** 30px — cards, containers, modals */
  lg: 30,

  /** 60px — large CTA buttons (pill) */
  xl: 60,

  /** Full pill — inputs, chips, status badges */
  pill: 9999,

  /** Circle — avatars */
  circle: 9999,
} as const;

export type RadiusKey = keyof typeof radii;

export const borderRadius = radii;

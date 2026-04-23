/**
 * Qupay spacing tokens
 *
 * 4px base grid following Squid's rhythm.
 * Heavy use of 12/16/20/24 gaps.
 */
const BASE = 4;

export const spacing = (multiplier: number) => BASE * multiplier;

/**
 * Named spacing values for common gaps
 */
export const spacingValues = {
  none: 0,
  xxs: spacing(1),  // 4
  xs: spacing(2),   // 8
  sm: spacing(3),   // 12
  md: spacing(4),   // 16
  lg: spacing(5),   // 20
  xl: spacing(6),   // 24
  xxl: spacing(8),  // 32
  xxxl: spacing(10), // 40
} as const;

// Re-export from new modules for backward compat
export { radii as borderRadius, radii } from './radii';
export { shadows } from './elevation';

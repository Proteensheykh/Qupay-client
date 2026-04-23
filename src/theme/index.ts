// Core exports
export { colors, palette } from './colors';
export type { ColorMode, ThemeColors } from './colors';

// Typography
export { typography, fontFamily } from './typography';

// Spacing & layout
export { spacing, spacingValues, borderRadius, radii } from './spacing';

// Elevation & shadows
export { shadows, borders, innerBorders, getCardElevation } from './elevation';
export type { ElevationStyle, ShadowKey, InnerBorderKey } from './elevation';

// Radii
export { radii as borderRadii } from './radii';
export type { RadiusKey } from './radii';

// Gradients
export { gradients } from './gradients';
export type { GradientName } from './gradients';

// Motion
export {
  durations,
  easings,
  springs,
  pressAnimation,
  isReduceMotionEnabled,
  addReduceMotionListener,
  getAnimatedDuration,
} from './motion';
export type { SpringConfig, DurationKey } from './motion';

// Theme context
export { ThemeProvider, useTheme } from './ThemeContext';
export type { ThemePreference } from './ThemeContext';

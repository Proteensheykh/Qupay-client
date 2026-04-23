import { TextStyle } from 'react-native';

/**
 * Qupay typography tokens — sourced from Squid Router CSS variables
 *
 * Geist Variable at weight 400 only. Hierarchy via size + color, not weight.
 * Font sizes rounded from Squid's rem-based scale (at 16px root).
 */
export const fontFamily = {
  regular: 'Geist_400Regular',
  // Legacy aliases — all map to Geist 400 since Squid uses 400 everywhere
  medium: 'Geist_400Regular',
  semiBold: 'Geist_400Regular',
  bold: 'Geist_400Regular',
  extraBold: 'Geist_400Regular',
};

type TypographyVariant = TextStyle;

export const typography: Record<string, TypographyVariant> = {
  // Display — heading-large (70px) and heading-medium (49px)
  display1: {
    fontFamily: fontFamily.regular,
    fontSize: 70,
    lineHeight: 76,
    letterSpacing: -1.4,
  },
  display2: {
    fontFamily: fontFamily.regular,
    fontSize: 49,
    lineHeight: 56,
    letterSpacing: -0.98,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.regular,
    fontSize: 35,
    lineHeight: 42,
    letterSpacing: -0.7,
  },
  h2: {
    fontFamily: fontFamily.regular,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
  },
  h3: {
    fontFamily: fontFamily.regular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  h4: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 24,
  },
  h5: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },

  // Body — body-large (28px), body-medium (22px), body-small (18px)
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 26,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: 22,
    lineHeight: 30,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmMedium: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },

  // Subheaders
  subheader1: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  subheader2: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Captions & labels — caption (14px)
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  captionMedium: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelXs: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Buttons — all weight 400 per Squid
  buttonL: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 24,
  },
  buttonM: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  buttonS: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },

  // Numbers / values — tabular with tight tracking
  value: {
    fontFamily: fontFamily.regular,
    fontSize: 70,
    lineHeight: 76,
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
  },
  valueLg: {
    fontFamily: fontFamily.regular,
    fontSize: 49,
    lineHeight: 56,
    letterSpacing: -0.98,
    fontVariant: ['tabular-nums'],
  },
  valueMd: {
    fontFamily: fontFamily.regular,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
    fontVariant: ['tabular-nums'],
  },
  valueSm: {
    fontFamily: fontFamily.regular,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  valueXs: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },

  // Mono-style text (rates, references, timers)
  mono: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  monoSm: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  monoXs: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },

  // Numpad key text
  numKeyText: {
    fontFamily: fontFamily.regular,
    fontSize: 28,
    lineHeight: 34,
  },

  // Legacy compat
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  main14: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  main12: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  main16: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  main21: {
    fontFamily: fontFamily.regular,
    fontSize: 21,
    lineHeight: 28,
  },
  secondary14: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  secondary12: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  secondary16: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  secondary21: {
    fontFamily: fontFamily.regular,
    fontSize: 21,
    lineHeight: 28,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
};

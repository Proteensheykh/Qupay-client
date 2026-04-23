/**
 * Qupay elevation tokens — sourced from Squid Router CSS variables
 *
 * One canonical shadow (light mode). Dark mode uses material hairlines.
 * No colored glows.
 */

import { ViewStyle } from 'react-native';
import { palette } from './colors';

export interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface BorderElevation {
  borderWidth: number;
  borderColor: string;
}

export const shadows: Record<string, ElevationStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 4,
  },

  containerAmbient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.33,
    shadowRadius: 50,
    elevation: 8,
  },

  // Legacy aliases
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.33,
    shadowRadius: 50,
    elevation: 8,
  },
  ctaGlow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  mintGlow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  violetGlow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const borders = {
  hairline: {
    dark: {
      borderWidth: 1,
      borderColor: palette.material.lightThin,
    },
    light: {
      borderWidth: 1,
      borderColor: palette.material.darkThin,
    },
  },
  focus: {
    borderWidth: 1,
    borderColor: palette.royal[500],
  },
  error: {
    borderWidth: 1,
    borderColor: palette.status.negative,
  },
} as const;

/** @deprecated Use borders.hairline.dark instead */
export const innerBorders = {
  subtle: borders.hairline.dark,
  medium: {
    borderWidth: 1,
    borderColor: palette.material.lightThin,
  },
  focus: borders.focus,
  error: borders.error,
} as const;

export function getCardElevation(
  mode: 'light' | 'dark',
  _level: 'subtle' | 'card' | 'elevated' = 'card'
): ViewStyle {
  if (mode === 'dark') {
    return {
      ...shadows.none,
      ...borders.hairline.dark,
    };
  }
  return {
    ...shadows.container,
    ...borders.hairline.light,
  };
}

export type ShadowKey = keyof typeof shadows;
export type InnerBorderKey = keyof typeof innerBorders;

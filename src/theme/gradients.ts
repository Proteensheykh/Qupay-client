/**
 * Qupay gradient tokens — minimal set
 *
 * Squid barely uses gradients. We follow suit: shimmer for skeletons,
 * corridor for send visualization, celebrate for success-burst.
 */

import { palette } from './colors';

export const gradients = {
  shimmer: {
    colors: [palette.grey[800], palette.grey[700], palette.grey[800]] as const,
    locations: [0, 0.5, 1] as const,
  },

  corridor: {
    colors: [palette.royal[500], palette.royal[300]] as const,
    locations: [0, 1] as const,
    angle: 90,
  },

  celebrate: {
    colors: [palette.royal[500], 'rgba(243,194,61,0.40)'] as const,
    locations: [0, 1] as const,
    angle: 135,
  },
} as const;

export type GradientName = keyof typeof gradients;

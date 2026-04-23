/**
 * Qupay motion tokens — Squid Router-inspired
 *
 * Durations, easings, and spring configs for animations.
 * All animations must respect AccessibilityInfo.isReduceMotionEnabled.
 */

import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

/**
 * Duration tokens (in milliseconds)
 */
export const durations = {
  instant: 0,
  fast: 160,
  base: 240,
  slow: 360,
  slower: 480,
  shimmer: 1600,
  marchingDash: 1200,
} as const;

/**
 * Easing presets
 * Note: These return worklet-compatible easing functions
 */
export const easings = {
  linear: Easing.linear,
  easeOut: Easing.out(Easing.quad),
  easeOutQuint: Easing.out(Easing.poly(5)),
  easeInOut: Easing.inOut(Easing.quad),
  easeInOutQuint: Easing.inOut(Easing.poly(5)),
} as const;

/**
 * Spring configurations for react-native-reanimated
 */
export const springs = {
  /**
   * Snappy spring for button presses
   */
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },

  /**
   * Gentle spring for bottom sheets and modals
   */
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },

  /**
   * Bouncy spring for success celebrations
   */
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },

  /**
   * Default spring for general transitions
   */
  default: {
    damping: 18,
    stiffness: 350,
    mass: 1,
  },
} as const;

/**
 * Press animation config
 */
export const pressAnimation = {
  scale: 0.97,
  duration: durations.fast,
} as const;

/**
 * Check if reduce motion is enabled (async)
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/**
 * Add listener for reduce motion changes
 */
export function addReduceMotionListener(
  callback: (enabled: boolean) => void
): { remove: () => void } {
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    callback
  );
  return subscription;
}

/**
 * Get duration respecting reduce motion preference
 */
export function getAnimatedDuration(
  duration: number,
  reduceMotion: boolean
): number {
  return reduceMotion ? 0 : duration;
}

export type SpringConfig = typeof springs.default;
export type DurationKey = keyof typeof durations;

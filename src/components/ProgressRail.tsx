import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, radii, gradients, durations } from '../theme';

interface ProgressRailProps {
  progress: number;
  height?: number;
  animated?: boolean;
}

export const ProgressRail: React.FC<ProgressRailProps> = ({
  progress,
  height = 6,
  animated = true,
}) => {
  const { theme } = useTheme();
  const progressValue = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    if (animated && !reduceMotion) {
      progressValue.value = withTiming(clampedProgress, {
        duration: durations.slow,
        easing: Easing.out(Easing.quad),
      });
    } else {
      progressValue.value = clampedProgress;
    }
  }, [progress, animated, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: theme.background.surface },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(progress * 100),
      }}
    >
      <Animated.View style={[styles.fill, { height }, fillStyle]}>
        <LinearGradient
          colors={gradients.corridor.colors as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
});

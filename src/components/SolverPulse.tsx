import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/colors';
import { isReduceMotionEnabled } from '../theme/motion';

interface SolverPulseProps {
  size?: number;
  color?: string;
}

/**
 * Solver-auction pulse — radial opacity pulse loop.
 * Suggests "solvers are competing for your route".
 * royal-500 at 12% opacity → 0% over 1.4s, repeating.
 */
export const SolverPulse: React.FC<SolverPulseProps> = ({
  size = 120,
  color = palette.royal[500],
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.06;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0, {
        duration: 1400,
        easing: Easing.out(Easing.quad),
      }),
      -1,
      true
    );
  }, [reduceMotion, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {},
});

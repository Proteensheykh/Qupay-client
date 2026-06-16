import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/colors';
import { isReduceMotionEnabled } from '../theme/motion';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CorridorWireProps {
  width?: number;
  height?: number;
  progress?: number;
  durationMs?: number;
}

/**
 * SVG corridor-wire visualization.
 * Stroke-dashoffset draw animation with a leading bead.
 * royal-500 for traveled segment, grey-700 for remaining, royal-300 bead.
 */
export const CorridorWire: React.FC<CorridorWireProps> = ({
  width = 300,
  height = 40,
  progress = 0,
  durationMs = 1200,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const padX = 24;
  const lineY = height / 2;
  const lineLength = width - padX * 2;

  const animProgress = useSharedValue(0);

  useEffect(() => {
    const duration = reduceMotion ? 0 : durationMs;
    animProgress.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, reduceMotion, durationMs, animProgress]);

  const traveledProps = useAnimatedProps(() => ({
    x2: padX + lineLength * animProgress.value,
  }));

  const beadProps = useAnimatedProps(() => ({
    cx: padX + lineLength * animProgress.value,
  }));

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Background track */}
        <Line
          x1={padX}
          y1={lineY}
          x2={width - padX}
          y2={lineY}
          stroke={palette.grey[300]}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Traveled segment */}
        <AnimatedLine
          x1={padX}
          y1={lineY}
          x2={padX}
          y2={lineY}
          stroke={palette.royal[500]}
          strokeWidth={3}
          strokeLinecap="round"
          animatedProps={traveledProps}
        />
        {/* Start anchor */}
        <Circle cx={padX} cy={lineY} r={5} fill={palette.royal[500]} />
        {/* End anchor */}
        <Circle cx={width - padX} cy={lineY} r={5} fill={palette.grey[300]} />
        {/* Leading bead */}
        <AnimatedCircle
          cx={padX}
          cy={lineY}
          r={4}
          fill={palette.royal[300]}
          animatedProps={beadProps}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});

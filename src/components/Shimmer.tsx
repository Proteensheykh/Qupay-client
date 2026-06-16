import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/colors';
import { radii } from '../theme/radii';
import { durations, spacing } from '../theme';

interface ShimmerProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
  borderRadiusSize?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width,
  height,
  style,
  borderRadiusSize = radii.sm,
}) => {
  const translateX = useSharedValue(-1);
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
    if (!reduceMotion) {
      translateX.value = withRepeat(
        withTiming(1, {
          duration: durations.shimmer,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const numericWidth = typeof width === 'number' ? width : 200;

  const shimmerTranslate = useAnimatedStyle(() => {
    const range = numericWidth * 2;
    return {
      transform: [{ translateX: translateX.value * range - numericWidth }],
    };
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadiusSize,
          backgroundColor: palette.grey[200],
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {!reduceMotion && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: numericWidth,
            },
            shimmerTranslate,
          ]}
        >
          <LinearGradient
            colors={[
              palette.grey[200],
              palette.grey[300],
              palette.grey[200],
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export const ShimmerAssetRow: React.FC = () => {
  return (
    <View style={shimmerStyles.assetRow}>
      <View style={shimmerStyles.assetLeft}>
        <Shimmer width={42} height={42} borderRadiusSize={21} />
        <View style={{ gap: spacing(1.5) }}>
          <Shimmer width={60} height={14} />
          <Shimmer width={90} height={12} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: spacing(1.5) }}>
        <Shimmer width={50} height={14} />
        <Shimmer width={70} height={12} />
      </View>
    </View>
  );
};

export const ShimmerCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <View style={shimmerStyles.card}>
      <Shimmer width={120} height={16} />
      <View style={{ marginTop: spacing(3), gap: spacing(2) }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} width={i === lines - 1 ? 160 : 280} height={14} />
        ))}
      </View>
    </View>
  );
};

export const ShimmerBalance: React.FC = () => {
  return (
    <View style={{ gap: spacing(2), alignItems: 'flex-start' }}>
      <Shimmer width={100} height={14} />
      <Shimmer width={200} height={40} borderRadiusSize={radii.sm} />
      <Shimmer width={140} height={12} />
    </View>
  );
};

const shimmerStyles = StyleSheet.create({
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing(3.5),
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  card: {
    padding: spacing(4),
  },
});

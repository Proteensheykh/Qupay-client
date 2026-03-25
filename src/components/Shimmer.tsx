import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, borderRadius, spacing } from '../theme';

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
  borderRadiusSize = borderRadius.sm,
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  const numericWidth = typeof width === 'number' ? width : 200;

  const animatedTranslate = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-numericWidth, numericWidth],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadiusSize,
          backgroundColor: theme.background.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: numericWidth,
          transform: [{ translateX: animatedTranslate }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.background.default + '80',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
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
      <Shimmer width={200} height={40} borderRadiusSize={borderRadius.sm} />
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

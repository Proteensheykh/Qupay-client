import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from './Icon';
import { useTheme, typography, spacing, radii, springs, durations } from '../theme';
import { palette } from '../theme/colors';
import { useHaptics } from '../hooks/useHaptics';

interface AnimatedSuccessProps {
  icon?: string;
  title: string;
  subtitle: string;
  color?: string;
  children?: React.ReactNode;
}

export const AnimatedSuccess: React.FC<AnimatedSuccessProps> = ({
  icon = 'checkmark',
  title,
  subtitle,
  color,
  children,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const discBg = color ? `${color}18` : palette.royal[500];
  const checkColor = color || palette.grey[100];

  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    haptics.success();

    if (reduceMotion) {
      scale.value = 1;
      textOpacity.value = 1;
      textTranslateY.value = 0;
    } else {
      scale.value = withSpring(1, springs.bouncy);
      textOpacity.value = withDelay(
        300,
        withTiming(1, { duration: durations.slow })
      );
      textTranslateY.value = withDelay(
        300,
        withTiming(0, { duration: durations.slow })
      );
    }
  }, [reduceMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background.default }]}>
      <Animated.View
        style={[styles.iconCircle, { backgroundColor: discBg }, iconStyle]}
      >
        <Ionicons name={icon as any} size={40} color={checkColor} />
      </Animated.View>

      <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
        <Text
          style={[
            typography.display2,
            { color: theme.text.primary, marginTop: spacing(6) },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: theme.text.secondary,
              textAlign: 'center',
              marginTop: spacing(2),
              paddingHorizontal: spacing(4),
            },
          ]}
        >
          {subtitle}
        </Text>
      </Animated.View>

      <Animated.View style={[{ width: '100%', marginTop: spacing(8) }, textStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

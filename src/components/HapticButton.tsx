import React, { useEffect, useState } from 'react';
import {
  Pressable,
  AccessibilityInfo,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface HapticButtonProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
  onPress?: (e: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  withScale?: boolean;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HapticButton: React.FC<HapticButtonProps> = ({
  hapticType = 'light',
  onPress,
  children,
  disabled = false,
  style,
  withScale = true,
  accessibilityLabel,
}) => {
  const { motion, palette, mode } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (withScale && !reduceMotion) {
      scale.value = withSpring(
        motion.pressAnimation.scale,
        motion.springs.snappy
      );
    }
  };

  const handlePressOut = () => {
    if (withScale && !reduceMotion) {
      scale.value = withSpring(1, motion.springs.snappy);
    }
  };

  const handlePress = (e: any) => {
    haptics[hapticType]();
    onPress?.(e);
  };

  const androidRipple =
    Platform.OS === 'android'
      ? {
          color:
            mode === 'dark'
              ? palette.material.lightThin
              : palette.material.darkThin,
          borderless: false,
        }
      : undefined;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={androidRipple}
      style={[animatedStyle, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {children}
    </AnimatedPressable>
  );
};

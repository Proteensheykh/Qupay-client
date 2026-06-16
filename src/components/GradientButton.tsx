import React, { useEffect, useMemo, useState } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { radii } from '../theme/radii';
import { useTheme, typography, spacing } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'large' | 'medium' | 'small';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  withGlow?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  size = 'medium',
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  withGlow: _withGlow = false,
}) => {
  const { theme, motion, palette } = useTheme();
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
    if (!reduceMotion) {
      scale.value = withSpring(
        motion.pressAnimation.scale,
        motion.springs.snappy
      );
    }
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, motion.springs.snappy);
    }
  };

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const sizeStyles = {
    large: {
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(8),
      minHeight: 56,
    },
    medium: {
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(6),
      minHeight: 48,
    },
    small: {
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(4),
      minHeight: 36,
    },
  };

  const textVariant =
    size === 'large'
      ? typography.buttonL
      : size === 'medium'
        ? typography.buttonM
        : typography.buttonS;

  const cornerRadius = size === 'large' ? radii.card : radii.xs;

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: palette.royal[500],
          color: palette.grey[100],
          borderWidth: 0 as number,
          borderColor: undefined as string | undefined,
        };
      case 'secondary':
        return {
          backgroundColor: theme.background.paper,
          color: theme.text.primary,
          borderWidth: 1,
          borderColor: theme.divider,
        };
      case 'tertiary':
        return {
          backgroundColor: theme.background.surface,
          color: theme.text.primary,
          borderWidth: 1,
          borderColor: theme.divider,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: theme.text.primary,
          borderWidth: 1,
          borderColor: theme.divider,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: theme.text.secondary,
          borderWidth: 0 as number,
          borderColor: undefined as string | undefined,
        };
      default:
        return {
          backgroundColor: palette.royal[500],
          color: palette.grey[100],
          borderWidth: 0 as number,
          borderColor: undefined as string | undefined,
        };
    }
  }, [
    variant,
    palette,
    theme.text.primary,
    theme.text.secondary,
    theme.divider,
    theme.background.paper,
    theme.background.surface,
  ]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        styles.base,
        sizeStyles[size],
        {
          borderRadius: cornerRadius,
          backgroundColor: variantStyle.backgroundColor,
        },
        variantStyle.borderWidth > 0
          ? {
              borderWidth: variantStyle.borderWidth,
              borderColor: variantStyle.borderColor,
            }
          : null,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.4 },
        style,
      ]}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[textVariant, { color: variantStyle.color }, textStyle]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

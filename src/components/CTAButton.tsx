import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
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
import { useTheme, typography } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface CTAButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  ghost?: boolean;
  danger?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  withGlow?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CTAButton: React.FC<CTAButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  ghost = false,
  danger = false,
  style,
  textStyle,
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

  const disabledBg = theme.background.surface;
  const disabledText = theme.text.disabled;

  if (danger) {
    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.danger,
          {
            borderRadius: radii.xl,
            backgroundColor: theme.error.bg,
            borderColor: `${theme.error.main}40`,
          },
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        <Text
          style={[
            typography.buttonM,
            { color: theme.error.main },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </AnimatedPressable>
    );
  }

  if (ghost) {
    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.ghost,
          { borderRadius: radii.xl, backgroundColor: theme.background.surface },
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.text.secondary} />
        ) : (
          <Text
            style={[
              typography.buttonM,
              { color: theme.text.secondary },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        styles.cta,
        {
          borderRadius: radii.xl,
          backgroundColor: disabled ? disabledBg : palette.royal[500],
        },
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.grey[100]} />
      ) : (
        <Text
          style={[
            typography.buttonM,
            {
              color: disabled ? disabledText : palette.grey[100],
              letterSpacing: -0.3,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  cta: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
  },
  ghost: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  danger: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.4,
  },
});

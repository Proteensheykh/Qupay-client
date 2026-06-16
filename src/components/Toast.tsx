import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from './Icon';
import {
  useTheme,
  typography,
  spacing,
  radii,
  shadows,
  springs,
  durations,
} from '../theme';
import { palette } from '../theme/colors';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3000,
}) => {
  const { theme } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
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
    if (visible) {
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        translateY.value = withSpring(0, springs.snappy);
        opacity.value = withTiming(1, { duration: durations.fast });
      }

      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, reduceMotion]);

  const dismiss = () => {
    if (reduceMotion) {
      translateY.value = -100;
      opacity.value = 0;
      onDismiss();
    } else {
      translateY.value = withTiming(-100, { duration: durations.base });
      opacity.value = withTiming(0, { duration: durations.fast }, () => {
        runOnJS(onDismiss)();
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const config = {
    success: {
      icon: 'checkmark-circle' as const,
      color: theme.success.main,
    },
    error: {
      icon: 'close-circle' as const,
      color: theme.error.main,
    },
    info: {
      icon: 'information-circle' as const,
      color: palette.royal[400],
    },
  };

  const c = config[type];

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: theme.background.inverse },
        shadows.elevated,
      ]}
    >
      <Pressable
        style={styles.content}
        onPress={dismiss}
        accessibilityRole="alert"
        accessibilityLabel={message}
      >
        <Ionicons name={c.icon} size={22} color={c.color} />
        <Text
          style={[typography.main14, { color: theme.text.inverse, flex: 1 }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing(14),
    left: spacing(4),
    right: spacing(4),
    borderRadius: radii.lg,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    padding: spacing(4),
  },
});

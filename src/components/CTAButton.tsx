import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme';
// shadows intentionally not imported — local CTAs don't use a glow.

interface CTAButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  ghost?: boolean;
  danger?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  ghost = false,
  danger = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  if (danger) {
    return (
      <TouchableOpacity
        style={[
          styles.danger,
          {
            backgroundColor: theme.error.bg,
            borderColor: `${theme.error.main}40`,
          },
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        <Text style={[styles.dangerText, { color: theme.error.main }, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  if (ghost) {
    return (
      <TouchableOpacity
        style={[styles.ghost, { backgroundColor: theme.background.surface }, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.text.secondary} />
        ) : (
          <Text style={[styles.ghostText, { color: theme.text.secondary }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.cta, { backgroundColor: theme.secondary.main }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.background.default} />
      ) : (
        <Text style={[styles.ctaText, { color: theme.background.default }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cta: {
    borderRadius: 999, // local CTAs are pill-shaped (R.pill)
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold', // T.ctaPurple — semibold, not extraBold
    fontSize: 16,
  },
  ghost: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // No border on dark surfaces in local design
  },
  ghostText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  danger: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  dangerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.4,
  },
});

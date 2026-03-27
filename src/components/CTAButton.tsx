import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { shadows } from '../theme/spacing';

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
  if (danger) {
    return (
      <TouchableOpacity
        style={[styles.danger, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        <Text style={[styles.dangerText, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  if (ghost) {
    return (
      <TouchableOpacity
        style={[styles.ghost, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="rgba(255,255,245,0.6)" />
        ) : (
          <Text style={[styles.ghostText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.cta, shadows.ctaGlow, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#060a07" />
      ) : (
        <Text style={[styles.ctaText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cta: {
    backgroundColor: '#00E5A0',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: '#060a07',
  },
  ghost: {
    backgroundColor: '#222236',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
  },
  ghostText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: 'rgba(255,255,245,0.6)',
  },
  danger: {
    backgroundColor: 'rgba(255,77,106,0.1)',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,77,106,0.25)',
    flexDirection: 'row',
    gap: 8,
  },
  dangerText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 15,
    color: '#FF4D6A',
  },
  disabled: {
    opacity: 0.4,
  },
});

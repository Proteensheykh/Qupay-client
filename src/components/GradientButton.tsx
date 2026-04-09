import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, borderRadius, spacing } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'large' | 'medium' | 'small';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  size = 'medium',
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const sizeStyles = {
    large: { paddingVertical: spacing(4), paddingHorizontal: spacing(8), minHeight: 56 },
    medium: { paddingVertical: spacing(3), paddingHorizontal: spacing(6), minHeight: 48 },
    small: { paddingVertical: spacing(2), paddingHorizontal: spacing(4), minHeight: 36 },
  };

  const textVariant = size === 'large' ? typography.buttonL : size === 'medium' ? typography.buttonM : typography.buttonS;

  const variantStyles: Record<string, { bg: string; textColor: string; border?: string }> = {
    primary: { bg: theme.background.paper, textColor: theme.text.primary },
    secondary: { bg: theme.background.surface, textColor: theme.text.primary },
    outline: { bg: 'transparent', textColor: theme.text.primary, border: theme.divider },
    ghost: { bg: 'transparent', textColor: theme.secondary.main },
  };

  const v = variantStyles[variant] || variantStyles.primary;

  return (
    <TouchableOpacity
      onPress={() => { haptics.light(); onPress(); }}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[textVariant, { color: v.textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

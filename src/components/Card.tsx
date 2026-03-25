import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, borderRadius, shadows, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'surface' | 'warm';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const { theme, mode } = useTheme();

  const bgMap = {
    default: theme.background.paper,
    elevated: theme.background.paper,
    surface: theme.background.surface,
    warm: theme.background.warm,
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgMap[variant] },
        mode === 'light' && { borderWidth: 1, borderColor: theme.divider },
        variant === 'elevated' && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing(4),
  },
});

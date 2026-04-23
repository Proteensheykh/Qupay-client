import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../theme/colors';
import { radii } from '../theme/radii';
import { useTheme } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type LegacyVariant = 'green' | 'yellow' | 'red';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant | LegacyVariant;
}

const variantMap: Record<LegacyVariant, BadgeVariant> = {
  green: 'success',
  yellow: 'warning',
  red: 'error',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant: variantProp,
}) => {
  const { theme } = useTheme();

  const variant: BadgeVariant =
    variantProp in variantMap
      ? variantMap[variantProp as LegacyVariant]
      : (variantProp as BadgeVariant);

  const bgMap: Record<BadgeVariant, string> = {
    success: theme.success.bg,
    warning: theme.warning.bg,
    error: theme.error.bg,
    info: theme.info.bg,
    neutral: theme.background.surface,
  };

  const colorMap: Record<BadgeVariant, string> = {
    success: palette.status.positive,
    warning: palette.status.partial,
    error: palette.status.negative,
    info: theme.info.main,
    neutral: theme.text.secondary,
  };

  return (
    <View
      style={[styles.badge, { backgroundColor: bgMap[variant] }]}
      accessible
      accessibilityLabel={`Status: ${label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: colorMap[variant] }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

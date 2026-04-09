import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

type BadgeVariant = 'green' | 'yellow' | 'red';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => {
  const { theme } = useTheme();
  const bgMap: Record<BadgeVariant, string> = {
    green: theme.success.bg,
    yellow: theme.warning.bg,
    red: theme.error.bg,
  };
  const colorMap: Record<BadgeVariant, string> = {
    green: theme.success.main,
    yellow: theme.warning.main,
    red: theme.error.main,
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
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
});

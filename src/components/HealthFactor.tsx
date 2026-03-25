import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, borderRadius } from '../theme';

interface HealthFactorProps {
  value: number;
  compact?: boolean;
}

export const HealthFactor: React.FC<HealthFactorProps> = ({ value, compact = false }) => {
  const { theme, brand } = useTheme();

  const getColor = () => {
    if (value >= 3) return brand.green;
    if (value >= 1.5) return theme.warning.main;
    return theme.error.main;
  };

  const getLabel = () => {
    if (value >= 3) return 'Safe';
    if (value >= 1.5) return 'Moderate';
    return 'Risky';
  };

  const color = getColor();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[typography.main14, { color }]}>{value.toFixed(2)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.surface }]}>
      <Text style={[typography.caption, { color: theme.text.secondary }]}>Health Factor</Text>
      <View style={styles.valueRow}>
        <Text style={[typography.valueSm, { color }]}>{value.toFixed(2)}</Text>
        <View style={[styles.badge, { backgroundColor: color + '18' }]}>
          <Text style={[typography.label, { color, fontSize: 10 }]}>{getLabel()}</Text>
        </View>
      </View>
      <View style={[styles.bar, { backgroundColor: theme.background.default }]}>
        <View
          style={[
            styles.barFill,
            { backgroundColor: color, width: `${Math.min(value / 5, 1) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    padding: spacing(4),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(1),
  },
  badge: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.5),
    borderRadius: borderRadius.pill,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing(3),
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

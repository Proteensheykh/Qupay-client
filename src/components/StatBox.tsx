import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, borderRadius } from '../theme';

interface StatBoxProps {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
}

export const StatBox: React.FC<StatBoxProps> = ({ label, value, subValue, valueColor }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background.surface }]}>
      <Text style={[typography.caption, { color: theme.text.secondary }]}>{label}</Text>
      <Text style={[typography.valueSm, { color: valueColor || theme.text.primary, marginTop: spacing(1) }]}>
        {value}
      </Text>
      {subValue && (
        <Text style={[typography.caption, { color: theme.text.muted, marginTop: spacing(0.5) }]}>
          {subValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    padding: spacing(4),
    flex: 1,
  },
});

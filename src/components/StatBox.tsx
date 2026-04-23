import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radii, innerBorders } from '../theme';

interface StatBoxProps {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
}

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  subValue,
  valueColor,
}) => {
  const { theme, mode } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.surface },
        mode === 'dark' && innerBorders.subtle,
      ]}
    >
      <Text style={[typography.caption, { color: theme.text.secondary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.valueSm,
          { color: valueColor || theme.text.primary, marginTop: spacing(1) },
        ]}
      >
        {value}
      </Text>
      {subValue && (
        <Text
          style={[
            typography.caption,
            { color: theme.text.muted, marginTop: spacing(0.5) },
          ]}
        >
          {subValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    padding: spacing(4),
    flex: 1,
  },
});

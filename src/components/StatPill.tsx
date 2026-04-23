import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useTheme, spacing, typography } from '../theme';

interface StatPillProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const StatPill: React.FC<StatPillProps> = ({
  label,
  value,
  variant = 'default',
}) => {
  const { theme, mode } = useTheme();
  const hairline =
    mode === 'dark' ? borders.hairline.dark : borders.hairline.light;

  const colorMap = {
    default: theme.text.primary,
    success: theme.success.main,
    warning: theme.warning.main,
    error: theme.error.main,
  };

  return (
    <View
      style={[
        styles.container,
        hairline,
        { backgroundColor: theme.background.surface },
      ]}
    >
      <Text style={[typography.caption, { color: theme.text.secondary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.valueXs,
          { color: colorMap[variant], marginLeft: spacing(2) },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.pill,
  },
});

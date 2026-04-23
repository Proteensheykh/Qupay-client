import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useTheme, spacing, typography } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  disabled = false,
}) => {
  const { theme, mode } = useTheme();
  const hairline =
    mode === 'dark' ? borders.hairline.dark : borders.hairline.light;
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.selection();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.chip,
        hairline,
        {
          backgroundColor: selected
            ? theme.secondary.main
            : theme.background.surface,
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          typography.captionMedium,
          {
            color: selected ? theme.primary.contrast : theme.text.primary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.pill,
  },
});

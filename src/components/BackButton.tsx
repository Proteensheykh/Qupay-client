import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from './Icon';
import { useTheme, radii, borders } from '../theme';
import { palette } from '../theme/colors';
import { useHaptics } from '../hooks/useHaptics';

interface BackButtonProps {
  onPress: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress }) => {
  const { theme, mode } = useTheme();
  const hairline = mode === 'dark' ? borders.hairline.dark : borders.hairline.light;
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: theme.background.surface },
        hairline,
        pressed && { opacity: 0.7 },
      ]}
      onPress={handlePress}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={20} color={palette.grey[300]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

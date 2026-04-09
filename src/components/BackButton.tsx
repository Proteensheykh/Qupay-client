import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from './Icon';
import { useTheme } from '../theme';

interface BackButtonProps {
  onPress: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: theme.background.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={18} color={theme.text.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface GradientAvatarProps {
  initials: string;
  size?: number;
  colors?: readonly [string, string, ...string[]];
  fontSize?: number;
  borderWidth?: number;
  borderColor?: string;
}

export const GradientAvatar: React.FC<GradientAvatarProps> = ({
  initials,
  size = 44,
  colors: colorsProp,
  fontSize,
  borderWidth,
  borderColor,
}) => {
  const { theme, gradient } = useTheme();
  const colors = colorsProp ?? (gradient.avatar1 as readonly [string, string, ...string[]]);
  const fs = fontSize || size * 0.3;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        },
        borderWidth ? { borderWidth, borderColor: borderColor || theme.inputBorder } : undefined,
      ]}
      accessible
      accessibilityLabel={`Avatar for ${initials}`}
      accessibilityRole="image"
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.initials, { fontSize: fs, color: theme.text.primary }]}>{initials}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_700Bold',
  },
});

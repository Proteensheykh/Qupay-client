import React from 'react';
import { View, ViewStyle } from 'react-native';
import { palette } from '../theme/colors';
import { borders, shadows } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useTheme, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'surface' | 'warm' | 'inner';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
}) => {
  const { theme, mode } = useTheme();

  const elevationStyle =
    mode === 'dark'
      ? { ...shadows.none, ...borders.hairline.dark }
      : { ...shadows.container, ...borders.hairline.light };

  const bgMap = {
    default:
      mode === 'dark' ? palette.grey[900] : theme.background.paper,
    elevated:
      mode === 'dark' ? palette.grey[900] : theme.background.paper,
    surface:
      mode === 'dark' ? palette.grey[900] : theme.background.surface,
    warm: mode === 'dark' ? palette.grey[900] : theme.background.warm,
    inner:
      mode === 'dark' ? palette.grey[900] : theme.background.surface,
  };

  const horizontalPadding = noPadding ? 0 : spacing(4);
  const verticalPadding = noPadding
    ? 0
    : variant === 'inner' || variant === 'surface'
      ? spacing(3)
      : spacing(4);

  return (
    <View
      style={[
        {
          borderRadius: radii.lg,
          paddingHorizontal: horizontalPadding,
          paddingVertical: verticalPadding,
          backgroundColor: bgMap[variant],
        },
        elevationStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

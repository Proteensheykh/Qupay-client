import React from 'react';
import { View, ViewStyle } from 'react-native';
import { palette } from '../theme/colors';
import { borders, shadows } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useTheme } from '../theme';

interface SurfaceProps {
  children: React.ReactNode;
  level?: 'base' | 'raised' | 'sunken';
  radius?: keyof typeof radii;
  style?: ViewStyle;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  level = 'raised',
  radius = 'lg',
  style,
}) => {
  const { theme, mode } = useTheme();

  const raisedElevation =
    mode === 'dark'
      ? { ...shadows.none, ...borders.hairline.dark }
      : { ...shadows.container, ...borders.hairline.light };

  const bgMap = {
    base: theme.background.default,
    raised:
      mode === 'dark' ? palette.grey[900] : theme.background.paper,
    sunken: theme.background.surface,
  };

  const sunkenOutline =
    mode === 'dark' ? borders.hairline.dark : borders.hairline.light;

  return (
    <View
      style={[
        {
          backgroundColor: bgMap[level],
          borderRadius: radii[radius],
        },
        level === 'raised' && raisedElevation,
        level === 'sunken' && sunkenOutline,
        style,
      ]}
    >
      {children}
    </View>
  );
};

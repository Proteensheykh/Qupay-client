import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';

interface GradientAvatarProps {
  initials: string;
  size?: number;
  colors?: readonly [string, string, ...string[]];
  fontSize?: number;
  withRing?: boolean;
}

export const GradientAvatar: React.FC<GradientAvatarProps> = ({
  initials,
  size = 44,
  colors: _colors,
  fontSize,
  withRing = true,
}) => {
  const { mode } = useTheme();
  const fs = fontSize || size * 0.36;

  const ringStyle =
    withRing && mode === 'dark' ? borders.hairline.dark : undefined;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: palette.royal[700],
          alignItems: 'center',
          justifyContent: 'center',
        },
        ringStyle,
      ]}
      accessible
      accessibilityLabel={`Avatar for ${initials}`}
      accessibilityRole="image"
    >
      <Text style={[styles.initials, { fontSize: fs, color: palette.royal[300] }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  initials: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
});

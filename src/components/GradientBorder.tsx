import React from 'react';
import { View, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, radii, gradients as themeGradients } from '../theme';
import { palette } from '../theme/colors';

interface GradientBorderProps {
  children: React.ReactNode;
  borderWidth?: number;
  radius?: number;
  gradient?: 'brand' | 'route' | 'hero';
  style?: ViewStyle;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  borderWidth = 1,
  radius = radii.xl,
  gradient = 'brand',
  style,
}) => {
  const { theme, gradient: modeGradient } = useTheme();

  const gradientConfig =
    gradient === 'brand'
      ? {
          colors: [palette.royal[500], palette.royal[600]] as const,
          locations: [0, 1] as const,
          end: { x: 1, y: 0 } as const,
        }
      : gradient === 'route'
        ? {
            colors: themeGradients.corridor.colors,
            locations: themeGradients.corridor.locations,
            end: { x: 1, y: 0 } as const,
          }
        : {
            colors: modeGradient.hero,
            locations: [0, 0.5, 1] as const,
            end: { x: 1, y: 1 } as const,
          };

  type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

  return (
    <View style={[{ borderRadius: radius, padding: borderWidth }, style]}>
      <LinearGradient
        colors={gradientConfig.colors as unknown as GradientColors}
        locations={gradientConfig.locations as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={gradientConfig.end}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
        }}
      />
      <View
        style={{
          backgroundColor: theme.background.paper,
          borderRadius: radius - borderWidth,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
};

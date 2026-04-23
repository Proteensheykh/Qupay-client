import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { palette } from '../theme/colors';

interface QupayLogoProps {
  size?: number;
  variant?: 'full' | 'mark';
  color?: string;
}

/**
 * Qupay logo — lowercase 'q' monogram or wordmark.
 * Single-color fill (royal-500 default), with optional amber accent dot.
 * Rounded geometric vocabulary, Geist-like strokes.
 */
export const QupayLogo: React.FC<QupayLogoProps> = ({
  size = 32,
  variant = 'full',
  color = palette.royal[500],
}) => {
  if (variant === 'mark') {
    return (
      <View
        style={{ width: size, height: size }}
        accessibilityLabel="Qupay"
        accessibilityRole="image"
      >
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Q circle — thick stroke, rounded */}
          <Path
            d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14c2.5 0 4.85-.65 6.9-1.8l2.1 2.8c.4.5 1.1.6 1.6.2.5-.4.6-1.1.2-1.6l-2-2.7C27.4 24.1 30 20.3 30 16c0-7.732-6.268-14-14-14zm0 24c-5.523 0-10-4.477-10-10S10.477 6 16 6s10 4.477 10 10-4.477 10-10 10z"
            fill={color}
          />
          {/* Amber accent dot at tail intersection */}
          <Circle cx="25.5" cy="27" r="2.2" fill={palette.highlight} />
        </Svg>
      </View>
    );
  }

  const textWidth = size * 2.8;
  const textHeight = size;

  return (
    <View
      style={{ width: textWidth, height: textHeight }}
      accessibilityLabel="Qupay"
      accessibilityRole="image"
    >
      <Svg width={textWidth} height={textHeight} viewBox="0 0 90 32">
        <SvgText
          x="0"
          y="26"
          fill={color}
          fontFamily="Geist_400Regular"
          fontSize="28"
          fontWeight="400"
          letterSpacing="-1"
        >
          qupay
        </SvgText>
        {/* Accent dot on the 'q' descender */}
        <Circle cx="7" cy="30.5" r="1.8" fill={palette.highlight} />
      </Svg>
    </View>
  );
};

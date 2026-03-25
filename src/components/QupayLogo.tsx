import React from 'react';
import { Text, StyleSheet } from 'react-native';
import MaskedView from '../utils/MaskedView';

interface QupayLogoProps {
  size?: number;
}

// Since MaskedView + LinearGradient isn't trivially available cross-platform,
// we just show the logo in the brand green color with bold Syne-like style
export const QupayLogo: React.FC<QupayLogoProps> = ({ size = 22 }) => {
  return (
    <Text
      style={[
        styles.logo,
        {
          fontSize: size,
          color: '#00E5A0',
        },
      ]}
    >
      Qupay
    </Text>
  );
};

const styles = StyleSheet.create({
  logo: {
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
  },
});

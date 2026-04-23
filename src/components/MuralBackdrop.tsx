import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { palette } from '../theme/colors';

interface MuralBackdropProps {
  opacity?: number;
}

/**
 * Full-screen currency-corridor wire lattice backdrop.
 * Single-color SVG silhouette over the mural ground color.
 * Used on Splash, SignIn, SignUp, Success screens.
 */
export const MuralBackdrop: React.FC<MuralBackdropProps> = ({
  opacity = 0.85,
}) => {
  const { width, height } = useWindowDimensions();

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: palette.marketing.ground },
      ]}
      pointerEvents="none"
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 1800 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <G
          fill="none"
          stroke={palette.marketing.muralFg}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        >
          <Path d="M120 280 C320 120, 620 80, 850 200 S1100 380, 1280 320" />
          <Path d="M780 100 C900 180, 960 320, 1020 400 S1140 560, 1320 580" />
          <Path d="M1100 220 C1200 300, 1340 340, 1480 280 S1640 200, 1720 260" />
          <Path d="M200 680 C380 580, 560 480, 740 440 S920 400, 1020 440" />
          <Path d="M1400 140 C1500 220, 1560 360, 1600 480 S1640 620, 1680 700" />
          <Path d="M820 60 C700 160, 560 340, 440 480 S280 640, 160 740" />
          <Path d="M80 320 C60 440, 80 560, 140 660 S240 760, 340 800" />
          <Path d="M1020 440 C1060 480, 1080 540, 1060 600 S1020 680, 980 740" />
          <Path d="M1320 580 C1300 640, 1260 720, 1200 780" />
          <Path d="M1100 220 C1040 180, 960 140, 880 120" />

          <Circle cx={120} cy={280} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={200} cy={680} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={340} cy={800} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={780} cy={100} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1020} cy={440} r={8} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1280} cy={320} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1320} cy={580} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1100} cy={220} r={6} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1480} cy={280} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1720} cy={260} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1400} cy={140} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1680} cy={700} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={1200} cy={780} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={160} cy={740} r={5} fill={palette.marketing.muralFg} stroke="none" />
          <Circle cx={980} cy={740} r={5} fill={palette.marketing.muralFg} stroke="none" />

          <G strokeWidth={1.2} opacity={0.5}>
            <Path d="M850 200 C880 260, 940 340, 1020 440" />
            <Path d="M1280 320 C1300 400, 1320 500, 1320 580" />
            <Path d="M740 440 C780 400, 820 340, 850 200" />
            <Path d="M440 480 C520 500, 640 480, 740 440" />
            <Path d="M1480 280 C1520 340, 1560 420, 1600 480" />
            <Path d="M1060 600 C1100 620, 1160 640, 1200 780" />
            <Path d="M1020 440 C1060 420, 1100 380, 1100 220" />
            <Path d="M1020 440 C960 420, 900 380, 850 200" />
          </G>
        </G>
      </Svg>
    </View>
  );
};

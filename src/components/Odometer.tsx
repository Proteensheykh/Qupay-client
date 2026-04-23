import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { isReduceMotionEnabled } from '../theme/motion';

interface OdometerProps {
  value: string;
  fontSize?: number;
  color?: string;
  staggerMs?: number;
  durationMs?: number;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Odometer digit-roll component.
 * Each digit column scrolls vertically to the target digit.
 * Staggered per-column for the signature Squid "counter roll" effect.
 */
export const Odometer: React.FC<OdometerProps> = ({
  value,
  fontSize = 70,
  color = palette.grey[300],
  staggerMs = 20,
  durationMs = 300,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const chars = useMemo(() => value.split(''), [value]);

  return (
    <View style={styles.row} accessibilityLabel={value} accessibilityRole="text">
      {chars.map((char, index) => {
        const isDigit = /\d/.test(char);
        if (!isDigit) {
          return (
            <Text
              key={`sep-${index}`}
              style={[
                styles.char,
                {
                  fontSize,
                  lineHeight: fontSize * 1.1,
                  color,
                  fontFamily: fontFamily.regular,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {char}
            </Text>
          );
        }

        return (
          <OdometerDigit
            key={`digit-${index}`}
            digit={parseInt(char, 10)}
            fontSize={fontSize}
            color={color}
            delay={index * staggerMs}
            duration={reduceMotion ? 0 : durationMs}
          />
        );
      })}
    </View>
  );
};

interface OdometerDigitProps {
  digit: number;
  fontSize: number;
  color: string;
  delay: number;
  duration: number;
}

const OdometerDigit: React.FC<OdometerDigitProps> = ({
  digit,
  fontSize,
  color,
  delay,
  duration,
}) => {
  const lineH = fontSize * 1.1;
  const translateY = useSharedValue(-digit * lineH);

  useEffect(() => {
    translateY.value = withTiming(-digit * lineH, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [digit, lineH, duration, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.digitClip, { height: lineH, width: fontSize * 0.62 }]}>
      <Animated.View style={animStyle}>
        {DIGITS.map((d) => (
          <Text
            key={d}
            style={[
              styles.char,
              {
                fontSize,
                lineHeight: lineH,
                color,
                fontFamily: fontFamily.regular,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  digitClip: {
    overflow: 'hidden',
  },
  char: {
    textAlign: 'center',
  },
});

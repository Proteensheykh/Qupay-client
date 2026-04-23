import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from './Icon';
import { spacing, useTheme, typography } from '../theme';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useHaptics } from '../hooks/useHaptics';

const KEYS_STANDARD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
const KEYS_DECIMAL  = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

const KEY_SIZE_DEFAULT = 72;
const KEY_SIZE_COMPACT = 64;

interface NumpadProps {
  onKey: (key: string) => void;
  size?: 'default' | 'compact';
  showDecimal?: boolean;
}

export const Numpad: React.FC<NumpadProps> = ({ onKey, size = 'default', showDecimal = false }) => {
  const { theme, mode } = useTheme();
  const haptics = useHaptics();
  const isCompact = size === 'compact';
  const keySize = isCompact ? KEY_SIZE_COMPACT : KEY_SIZE_DEFAULT;
  const hairline = mode === 'dark' ? borders.hairline.dark : borders.hairline.light;
  const keys = showDecimal ? KEYS_DECIMAL : KEYS_STANDARD;

  const handlePress = (key: string) => {
    if (key !== '') {
      haptics.light();
      onKey(key);
    }
  };

  return (
    <View style={[styles.numpad, isCompact && styles.numpadCompact]}>
      {keys.map((key, idx) => (
        <Pressable
          key={idx}
          style={({ pressed }) => [
            styles.numKey,
            {
              width: keySize,
              height: keySize,
              borderRadius: radii.pill,
              backgroundColor: palette.grey[800],
            },
            hairline,
            key === '' && styles.numKeyEmpty,
            pressed && key !== '' && { opacity: 0.5 },
          ]}
          onPress={() => handlePress(key)}
          disabled={key === ''}
          accessibilityLabel={key === 'del' ? 'Delete' : key || undefined}
          accessibilityRole="button"
        >
          {key === 'del' ? (
            <Ionicons
              name="backspace-outline"
              size={isCompact ? 22 : 26}
              color={theme.text.primary}
            />
          ) : (
            <Text
              style={[
                typography.numKeyText,
                isCompact && styles.numKeyTextCompact,
                { color: theme.text.primary },
              ]}
            >
              {key}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing(3),
    rowGap: spacing(3),
    paddingHorizontal: spacing(10),
    paddingBottom: spacing(8),
  },
  numpadCompact: {
    paddingHorizontal: 0,
    paddingBottom: spacing(3),
    width: 260,
    alignSelf: 'center',
  },
  numKey: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyEmpty: {
    opacity: 0,
  },
  numKeyTextCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
});

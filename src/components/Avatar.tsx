import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getAvatarUri, AvatarStyle, findBankLogo } from '../data/logos';
import { useTheme } from '../theme';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';

interface AvatarProps {
  seed: string;
  initials?: string;
  size?: number;
  style?: AvatarStyle;
  bankBadge?: string;
  ringColor?: string;
  withRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  initials,
  size = 44,
  style = 'shapes',
  bankBadge,
  ringColor,
  withRing = true,
}) => {
  const { theme, mode } = useTheme();
  const resolvedRingColor = ringColor ?? theme.background.paper;
  const [imageErr, setImageErr] = useState(false);
  const radius = size / 2;
  const fallbackInitials = (initials || seed)
    .trim()
    .substring(0, 2)
    .toUpperCase();
  const badgeSize = Math.round(size * 0.42);

  const ringStyle =
    withRing && mode === 'dark' ? borders.hairline.dark : undefined;

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={seed}
    >
      {imageErr ? (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: palette.royal[700],
            },
            ringStyle,
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              { fontSize: size * 0.36, color: palette.royal[300] },
            ]}
          >
            {fallbackInitials}
          </Text>
        </View>
      ) : (
        <View style={[{ borderRadius: radius, overflow: 'hidden' }, ringStyle]}>
          <Image
            source={{ uri: getAvatarUri(seed, style) }}
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: theme.background.surface,
            }}
            onError={() => setImageErr(true)}
          />
        </View>
      )}

      {bankBadge && findBankLogo(bankBadge) ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize + 4,
              height: badgeSize + 4,
              borderRadius: (badgeSize + 4) / 2,
              backgroundColor: resolvedRingColor,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Image
            source={{ uri: findBankLogo(bankBadge)!.uri }}
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: '#FFFFFF',
            }}
            resizeMode="contain"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

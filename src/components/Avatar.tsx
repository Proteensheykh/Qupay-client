// Avatar — abstract DiceBear avatar with optional bank-logo badge.
// Uses a remote PNG (deterministic per seed) so the same name always gets
// the same avatar. Falls back to initials on a tinted circle if the remote
// image fails to load.
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getAvatarUri, AvatarStyle, findBankLogo } from '../data/logos';
import { useTheme } from '../theme';

interface AvatarProps {
  // Seed determines which avatar is generated (use full name for stability)
  seed: string;
  // Optional initials shown only if the remote image fails
  initials?: string;
  size?: number;
  style?: AvatarStyle;
  // If provided, a small bank logo badge is overlaid bottom-right
  bankBadge?: string;
  // Surface color used for the badge ring — match parent card (defaults to theme.background.paper)
  ringColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  initials,
  size = 44,
  style = 'shapes',
  bankBadge,
  ringColor,
}) => {
  const { theme } = useTheme();
  const resolvedRingColor = ringColor ?? theme.background.paper;
  const [imageErr, setImageErr] = useState(false);
  const radius = size / 2;
  const fallbackInitials = (initials || seed).trim().substring(0, 2).toUpperCase();
  const badgeSize = Math.round(size * 0.42);

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={seed}>
      {imageErr ? (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: theme.background.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              { fontSize: size * 0.36, color: theme.text.primary },
            ]}
          >
            {fallbackInitials}
          </Text>
        </View>
      ) : (
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
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

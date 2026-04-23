import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { findCurrencyLogo, findNetworkLogo, BrandLogo } from '../data/logos';
import { useTheme } from '../theme';
import { borders } from '../theme/elevation';

interface CryptoIconProps {
  token: string;
  network?: string;
  size?: number;
  ringColor?: string;
  withRing?: boolean;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  token,
  network,
  size = 40,
  ringColor: ringColorProp,
  withRing = true,
}) => {
  const { theme, mode } = useTheme();
  const ringColor = ringColorProp ?? theme.background.paper;
  const [tokenErr, setTokenErr] = useState(false);
  const [netErr, setNetErr] = useState(false);

  const tokenLogo: BrandLogo | undefined = findCurrencyLogo(token);
  const netLogo: BrandLogo | undefined = findNetworkLogo(network);

  const radius = size / 2;
  const badgeSize = Math.round(size * 0.42);
  const badgeRadius = badgeSize / 2;

  const ringStyle =
    withRing && mode === 'dark' ? borders.hairline.dark : undefined;

  const tokenNode =
    tokenLogo && !tokenErr ? (
      <View
        style={[
          styles.tokenChip,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: tokenLogo.bg || theme.text.primary,
          },
          ringStyle,
        ]}
      >
        <Image
          source={{ uri: tokenLogo.uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
          onError={() => setTokenErr(true)}
        />
      </View>
    ) : (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: theme.background.surface,
          },
          ringStyle,
        ]}
      >
        <Text
          style={[
            styles.fallbackText,
            { fontSize: size * 0.36, color: theme.text.primary },
          ]}
        >
          {token.substring(0, 4).toUpperCase()}
        </Text>
      </View>
    );

  if (!network) {
    return (
      <View accessible accessibilityLabel={token}>
        {tokenNode}
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={`${token} on ${network}`}
    >
      {tokenNode}
      <View
        style={[
          styles.badge,
          {
            width: badgeSize + 4,
            height: badgeSize + 4,
            borderRadius: (badgeSize + 4) / 2,
            backgroundColor: ringColor,
            right: -2,
            bottom: -2,
          },
        ]}
      >
        {netLogo && !netErr ? (
          <Image
            source={{ uri: netLogo.uri }}
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              backgroundColor: netLogo.bg || theme.text.primary,
            }}
            resizeMode="cover"
            onError={() => setNetErr(true)}
          />
        ) : (
          <View
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              backgroundColor: theme.background.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: badgeSize * 0.5,
                color: theme.text.primary,
              }}
            >
              {network.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tokenChip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  },
});

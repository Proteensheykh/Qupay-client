import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { MuralBackdrop } from '../../components';
import { userProfile } from '../../data/mockData';
import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';

type Props = NativeStackScreenProps<SendFlowParamList, 'Success'>;

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const truncateAddress = (addr: string): string => {
  if (!addr || addr.length <= 14) return addr || '';
  return `${addr.slice(0, 8)}\u2026${addr.slice(-6)}`;
};

export const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientMethod = 'OPay',
    amount = 200,
    receiveAmount = 329000,
    recvCurrency = 'NGN',
    sendCurrency: _sendCurrency,
    recipientWalletAddress,
    recipientNetwork,
  } = route.params || {};

  const isCryptoOut = recvCurrency === 'USDT';
  const symbol = currencySymbols[recvCurrency] || '';
  const firstName = recipientName.split(' ')[0];

  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconScale, contentOpacity]);

  const goToReceipt = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: 'Amount' as any,
        }],
      })
    );
    const tabNav = navigation.getParent();
    if (tabNav) {
      tabNav.navigate('HistoryTab', {
        screen: 'TransferDetail',
        params: { status: 'delivered' },
      });
    }
  };

  const sendAgain = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Amount' }] });
  };

  const textPrimary = palette.grey[100];
  const textSecondary = palette.grey[500];
  const textMuted = palette.grey[600];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <MuralBackdrop />
        <View style={styles.foreground}>
          <View style={styles.container}>
            <View style={styles.content}>
              <Animated.View
                style={[
                  styles.sucIcon,
                  {
                    backgroundColor: palette.royal[500],
                    transform: [{ scale: iconScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark" size={32} color={palette.grey[100]} />
              </Animated.View>

              <Animated.View
                style={{ opacity: contentOpacity, alignItems: 'center', alignSelf: 'stretch' }}
              >
                <Text style={[styles.sucTitle, { color: textPrimary }]}>
                  Delivered {'\u{1F389}'}
                </Text>
                <Text style={[styles.sucSub, { color: textSecondary }]}>
                  {isCryptoOut
                    ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT sent to ${truncateAddress(recipientWalletAddress || '')}`
                    : `${firstName} received ${symbol}${receiveAmount.toLocaleString()}`}
                </Text>

                {isCryptoOut ? (
                  <View
                    style={[
                      styles.cryptoCard,
                      {
                        backgroundColor: palette.grey[800],
                        borderColor: palette.material.lightThin,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cryptoIcon,
                        { backgroundColor: `${palette.royal[500]}33` },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={palette.royal[400]}
                      />
                    </View>
                    <View style={styles.cryptoBody}>
                      <Text style={[styles.cryptoTitle, { color: textPrimary }]}>
                        Transaction confirmed
                      </Text>
                      <Text style={[styles.cryptoMsg, { color: textSecondary }]}>
                        {receiveAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        USDT has been sent to the wallet on {recipientNetwork}
                      </Text>
                      <View style={styles.cryptoAddrRow}>
                        <Text style={[styles.cryptoAddrLabel, { color: textMuted }]}>
                          To:
                        </Text>
                        <Text
                          style={[styles.cryptoAddr, { color: palette.royal[300] }]}
                        >
                          {truncateAddress(recipientWalletAddress || '')}
                        </Text>
                      </View>
                      <View style={styles.cryptoTag}>
                        <Ionicons
                          name="checkmark"
                          size={10}
                          color={palette.status.positive}
                        />
                        <Text
                          style={[styles.cryptoTagText, { color: palette.status.positive }]}
                        >
                          On-chain confirmed
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.notifCard,
                      {
                        backgroundColor: palette.grey[800],
                        borderColor: palette.material.lightThin,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.notifIcon,
                        { backgroundColor: `${palette.status.positive}33` },
                      ]}
                    >
                      <Text style={styles.notifIconText}>{'\u{1F4AC}'}</Text>
                    </View>
                    <View style={styles.notifBody}>
                      <Text style={[styles.notifTitle, { color: textPrimary }]}>
                        {firstName} was notified
                      </Text>
                      <Text style={[styles.notifMsg, { color: textSecondary }]}>
                        "{userProfile.name} sent you {symbol}
                        {receiveAmount.toLocaleString()} via Qupay. Check your {recipientMethod}{' '}
                        now."
                      </Text>
                      <View style={styles.notifTag}>
                        <Ionicons
                          name="checkmark"
                          size={10}
                          color={palette.status.positive}
                        />
                        <Text
                          style={[styles.notifTagText, { color: palette.status.positive }]}
                        >
                          SMS delivered
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.dualCta}>
                  <TouchableOpacity
                    onPress={sendAgain}
                    style={[styles.ctaPill, styles.ctaSecondary]}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Send again"
                  >
                    <Text style={[typography.buttonM, { color: palette.grey[900] }]}>
                      Send again
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToReceipt}
                    style={[styles.ctaPill, styles.ctaPrimary]}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                  >
                    <Text style={[typography.buttonM, { color: palette.grey[100] }]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  root: { flex: 1 },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  container: { flex: 1, justifyContent: 'center' },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sucIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sucTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    marginBottom: 8,
  },
  sucSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  cryptoCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  cryptoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoBody: { flex: 1 },
  cryptoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  cryptoMsg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  cryptoAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  cryptoAddrLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  cryptoAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  cryptoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cryptoTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: { fontSize: 18 },
  notifBody: { flex: 1 },
  notifTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  notifMsg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  notifTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  dualCta: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  ctaPill: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ctaSecondary: {
    backgroundColor: palette.grey[100],
  },
  ctaPrimary: {
    backgroundColor: palette.royal[500],
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CTAButton } from '../../components';
import { userProfile } from '../../data/mockData';
import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

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
    sendCurrency,
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Success icon */}
          <Animated.View style={[styles.sucIcon, { transform: [{ scale: iconScale }] }]}>
            <Ionicons name="checkmark" size={32} color="#00E5A0" />
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity, alignItems: 'center', alignSelf: 'stretch' }}>
          <Text style={styles.sucTitle}>Delivered {'\u{1F389}'}</Text>
          <Text style={styles.sucSub}>
            {isCryptoOut
              ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT sent to ${truncateAddress(recipientWalletAddress || '')}`
              : `${firstName} received ${symbol}${receiveAmount.toLocaleString()}`}
          </Text>

          {isCryptoOut ? (
            /* On-chain confirmation card for crypto-out */
            <View style={styles.cryptoCard}>
              <View style={styles.cryptoIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#00E5A0" />
              </View>
              <View style={styles.cryptoBody}>
                <Text style={styles.cryptoTitle}>Transaction confirmed</Text>
                <Text style={styles.cryptoMsg}>
                  {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT has been sent to the wallet on {recipientNetwork}
                </Text>
                <View style={styles.cryptoAddrRow}>
                  <Text style={styles.cryptoAddrLabel}>To:</Text>
                  <Text style={styles.cryptoAddr}>{truncateAddress(recipientWalletAddress || '')}</Text>
                </View>
                <View style={styles.cryptoTag}>
                  <Ionicons name="checkmark" size={10} color="#00E5A0" />
                  <Text style={styles.cryptoTagText}>On-chain confirmed</Text>
                </View>
              </View>
            </View>
          ) : (
            /* Notification card for fiat-out */
            <View style={styles.notifCard}>
              <View style={styles.notifIcon}>
                <Text style={styles.notifIconText}>{'\u{1F4AC}'}</Text>
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{firstName} was notified</Text>
                <Text style={styles.notifMsg}>
                  "{userProfile.name} sent you {symbol}
                  {receiveAmount.toLocaleString()} via Qupay. Check your {recipientMethod} now."
                </Text>
                <View style={styles.notifTag}>
                  <Ionicons name="checkmark" size={10} color="#25d366" />
                  <Text style={styles.notifTagText}>SMS delivered</Text>
                </View>
              </View>
            </View>
          )}

          {/* Buttons */}
          <CTAButton
            title="View receipt"
            onPress={goToReceipt}
            style={styles.receiptBtn}
          />
          <CTAButton
            title="Share receipt"
            ghost
            onPress={() => {}}
            style={styles.shareBtn}
          />
          <TouchableOpacity
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Amount' }] })}
            style={styles.sendAgainLink}
            activeOpacity={0.7}
          >
            <Text style={styles.sendAgainText}>Send Again</Text>
          </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  container: { flex: 1, justifyContent: 'center' },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sucIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 2,
    borderColor: '#00E5A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sucTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: '#FFFFF5',
    marginBottom: 8,
  },
  sucSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.6)',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Crypto confirmation card
  cryptoCard: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
    borderRadius: 12,
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
    backgroundColor: 'rgba(0,229,160,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoBody: { flex: 1 },
  cryptoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  cryptoMsg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
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
    color: 'rgba(255,255,245,0.4)',
  },
  cryptoAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#00E5A0',
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
    color: '#00E5A0',
  },
  // Fiat notification card
  notifCard: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
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
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: { fontSize: 18 },
  notifBody: { flex: 1 },
  notifTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  notifMsg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
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
    color: '#25d366',
  },
  receiptBtn: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  shareBtn: {
    alignSelf: 'stretch',
  },
  sendAgainLink: {
    marginTop: 20,
    paddingVertical: 12,
  },
  sendAgainText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#00E5A0',
    textAlign: 'center',
  },
});

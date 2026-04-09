import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import { useTransactionStore } from '../../store/transactionStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<SendFlowParamList, 'DepositWaiting'>;

type StepState = 'waiting' | 'active' | 'done';

interface Step {
  label: string;
  desc: string;
  state: StepState;
}

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const truncateAddress = (addr: string): string => {
  if (!addr || addr.length <= 14) return addr || '';
  return `${addr.slice(0, 8)}\u2026${addr.slice(-6)}`;
};

export const DepositWaitingScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    transactionId,
    transactionSlug,
    recipientName = 'Emeka Johnson',
    recipientMethod = 'OPay',
    recipientFlag = '\u{1F1F3}\u{1F1EC}',
    amount = 200,
    receiveAmount = 329000,
    sendCurrency = 'USDT',
    recvCurrency = 'NGN',
    network = 'Polygon',
    recipientWalletAddress,
    recipientNetwork,
  } = route.params || {};

  const { theme } = useTheme();
  const updateStatus = useTransactionStore((state) => state.updateStatus);

  const isCryptoOut = recvCurrency === 'USDT';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const recvSymbol = currencySymbols[recvCurrency] || '';

  const formatUSDT = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const initialSteps: Step[] = useMemo(() => {
    if (isCryptoOut) {
      return [
        { label: 'Processing payment', desc: `Confirming your ${sendSymbol}${amount.toLocaleString()} ${sendCurrency} payment`, state: 'active' },
        { label: 'Payment confirmed', desc: `${sendSymbol}${amount.toLocaleString()} ${sendCurrency} received`, state: 'waiting' },
        { label: 'Converting & sending', desc: `Sending ${formatUSDT(receiveAmount)} USDT to ${truncateAddress(recipientWalletAddress || '')}`, state: 'waiting' },
        { label: 'Delivered', desc: `USDT sent to recipient's wallet on ${recipientNetwork}`, state: 'waiting' },
      ];
    }
    return [
      { label: 'Listening for deposit', desc: `Watching ${network} for your ${sendCurrency} transfer`, state: 'active' },
      { label: 'Deposit confirmed', desc: `${amount} ${sendCurrency} received and locked`, state: 'waiting' },
      { label: 'Converting & sending', desc: `Releasing ${recvSymbol}${receiveAmount.toLocaleString()} to ${recipientMethod}`, state: 'waiting' },
      { label: 'Delivered', desc: `${recipientName.split(' ')[0]} received the funds`, state: 'waiting' },
    ];
  }, [isCryptoOut, sendSymbol, amount, sendCurrency, receiveAmount, recipientWalletAddress, recipientNetwork, network, recvSymbol, recipientMethod, recipientName]);

  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [detected, setDetected] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setDetected(true);
      setSteps((prev) => prev.map((s, i) =>
        i === 0 ? { ...s, state: 'done' }
        : i === 1 ? { ...s, state: 'active' }
        : s
      ));
      if (transactionId) {
        updateStatus(transactionId, 'DEPOSIT_CONFIRMED');
      }
    }, 4000);

    const t2 = setTimeout(() => {
      setSteps((prev) => prev.map((s, i) =>
        i <= 1 ? { ...s, state: 'done' }
        : i === 2 ? { ...s, state: 'active' }
        : s
      ));
      if (transactionId) {
        updateStatus(transactionId, 'MATCHED');
      }
    }, 6000);

    const t3 = setTimeout(() => {
      setSteps((prev) => prev.map((s) => ({ ...s, state: 'done' })));
      if (transactionId) {
        updateStatus(transactionId, 'SETTLEMENT_IN_PROGRESS');
      }
    }, 8000);

    const t4 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (transactionId) {
        updateStatus(transactionId, 'COMPLETED');
      }
      navigation.replace('Success', {
        transactionSlug,
        recipientName,
        recipientMethod,
        recipientFlag,
        amount,
        receiveAmount,
        recvCurrency,
        sendCurrency,
        recipientWalletAddress,
        recipientNetwork,
      });
    }, 9500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [navigation, recipientName, recipientMethod, recipientFlag, amount, receiveAmount, recvCurrency, sendCurrency, recipientWalletAddress, recipientNetwork, transactionId, transactionSlug, updateStatus]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const getTitle = () => {
    if (isCryptoOut) {
      return detected ? 'Payment confirmed' : 'Processing payment';
    }
    return detected ? 'Deposit received' : 'Waiting for deposit';
  };

  const getSubtitle = () => {
    if (isCryptoOut) {
      return detected
        ? `${sendSymbol}${amount.toLocaleString()} ${sendCurrency} confirmed`
        : `Processing your ${sendSymbol}${amount.toLocaleString()} ${sendCurrency} payment`;
    }
    return detected
      ? `${amount} ${sendCurrency} confirmed on ${network}`
      : `Send ${amount} ${sendCurrency} to complete this transfer`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <View style={styles.container}>
        {/* Top section */}
        <View style={styles.top}>
          {/* Transaction slug badge */}
          {transactionSlug && (
            <View
              style={[
                styles.slugBadge,
                { backgroundColor: theme.info.bg, borderColor: theme.secondary.light },
              ]}
            >
              <Text style={[styles.slugText, { color: theme.secondary.main }]}>{transactionSlug}</Text>
            </View>
          )}

          {/* Scanning indicator */}
          <View style={styles.scanWrap}>
            {!detected && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity, borderColor: theme.secondary.main },
                ]}
              />
            )}
            <View
              style={[
                styles.scanIcon,
                detected
                  ? { backgroundColor: theme.info.bg, borderColor: theme.secondary.main }
                  : { backgroundColor: theme.info.bg, borderColor: theme.secondary.light },
              ]}
            >
              {detected ? (
                <Ionicons name="checkmark" size={32} color={theme.secondary.main} />
              ) : (
                <Ionicons name={isCryptoOut ? 'card-outline' : 'radio-outline'} size={32} color={theme.secondary.main} />
              )}
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text.primary }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{getSubtitle()}</Text>

          {/* Amount badge */}
          <View
            style={[
              styles.amountBadge,
              { backgroundColor: theme.info.bg, borderColor: theme.info.bg },
            ]}
          >
            <Text style={[styles.amountBadgeText, { color: theme.secondary.main }]}>
              {sendSymbol}{amount.toLocaleString()} {sendCurrency} {'\u2192'} {isCryptoOut ? `${formatUSDT(receiveAmount)} USDT` : `${recvSymbol}${receiveAmount.toLocaleString()} ${recvCurrency}`}
            </Text>
          </View>
        </View>

        {/* Steps timeline */}
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineStep}>
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: theme.inputBorder },
                    step.state !== 'waiting' && { backgroundColor: theme.secondary.main },
                  ]}
                />
              )}
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    step.state === 'active' && {
                      borderColor: theme.secondary.main,
                      backgroundColor: theme.info.bg,
                    },
                    step.state === 'done' && {
                      borderColor: theme.secondary.main,
                      backgroundColor: theme.secondary.main,
                    },
                    step.state === 'waiting' && {
                      borderColor: theme.action.selected,
                      backgroundColor: 'transparent',
                    },
                  ]}
                >
                  {step.state === 'done' && (
                    <Ionicons name="checkmark" size={12} color={theme.background.default} />
                  )}
                  {step.state === 'active' && (
                    <View style={[styles.stepDotPulse, { backgroundColor: theme.secondary.main }]} />
                  )}
                </View>
                <View style={styles.stepText}>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: theme.text.disabled },
                      step.state === 'active' && { color: theme.text.primary, fontFamily: 'Inter_600SemiBold' },
                      step.state === 'done' && { color: theme.secondary.main, fontFamily: 'Inter_600SemiBold' },
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text style={[styles.stepDesc, { color: theme.text.muted }]}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          <Text style={[styles.bottomNote, { color: theme.text.disabled }]}>
            {detected
              ? 'Processing your transfer\u2026'
              : isCryptoOut
                ? 'Please wait while we process your payment'
                : 'You can leave the app \u2014 we\u2019ll notify you when we detect your deposit'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 24 },
  slugBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  slugText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  scanWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseRing: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2,
  },
  scanIcon: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    textAlign: 'center', lineHeight: 20, marginBottom: 16,
  },
  amountBadge: {
    borderWidth: 1,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18,
  },
  amountBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  timeline: { paddingHorizontal: 32, paddingVertical: 8 },
  timelineStep: { position: 'relative' },
  connector: {
    position: 'absolute', left: 10, top: -8, width: 2, height: 16,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 10 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, marginTop: 1,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotPulse: { width: 8, height: 8, borderRadius: 4 },
  stepText: { flex: 1 },
  stepLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 14,
  },
  stepDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  bottom: { paddingHorizontal: 24, paddingBottom: 36 },
  bottomNote: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    textAlign: 'center', lineHeight: 18,
  },
});

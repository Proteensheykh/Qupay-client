import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CTAButton } from '../../components';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'DepositWaiting'>;

type StepState = 'waiting' | 'active' | 'done';

interface Step {
  label: string;
  desc: string;
  state: StepState;
}

export const DepositWaitingScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientMethod = 'OPay',
    recipientFlag = '\u{1F1F3}\u{1F1EC}',
    amount = 200,
    receiveAmount = 329000,
    sendCurrency = 'USDT',
    recvCurrency = 'NGN',
    network = 'Polygon',
    dest,
  } = route.params || {};

  const symbol = dest?.symbol || '\u20A6';

  const [steps, setSteps] = useState<Step[]>([
    { label: 'Listening for deposit', desc: `Watching ${network} for your ${sendCurrency} transfer`, state: 'active' },
    { label: 'Deposit confirmed',     desc: `${amount} ${sendCurrency} received and locked`,           state: 'waiting' },
    { label: 'Converting & sending',  desc: `Releasing ${symbol}${receiveAmount.toLocaleString()} to ${recipientMethod}`, state: 'waiting' },
    { label: 'Delivered',             desc: `${recipientName.split(' ')[0]} received the funds`,      state: 'waiting' },
  ]);

  const [detected, setDetected] = useState(false);

  // Pulse animation for the scanning ring
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

  // Simulate deposit detection after 4 seconds
  useEffect(() => {
    const t1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setDetected(true);
      setSteps((prev) => prev.map((s, i) =>
        i === 0 ? { ...s, state: 'done' }
        : i === 1 ? { ...s, state: 'active' }
        : s
      ));
    }, 4000);

    const t2 = setTimeout(() => {
      setSteps((prev) => prev.map((s, i) =>
        i <= 1 ? { ...s, state: 'done' }
        : i === 2 ? { ...s, state: 'active' }
        : s
      ));
    }, 6000);

    const t3 = setTimeout(() => {
      setSteps((prev) => prev.map((s) => ({ ...s, state: 'done' })));
    }, 8000);

    const t4 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Success', {
        recipientName,
        recipientMethod,
        recipientFlag,
        amount,
        receiveAmount,
        dest,
      });
    }, 9500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [navigation, recipientName, recipientMethod, recipientFlag, amount, receiveAmount, dest, symbol, sendCurrency, network]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top section */}
        <View style={styles.top}>
          {/* Scanning indicator */}
          <View style={styles.scanWrap}>
            {!detected && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
            )}
            <View style={[styles.scanIcon, detected && styles.scanIconDone]}>
              {detected ? (
                <Ionicons name="checkmark" size={32} color="#00E5A0" />
              ) : (
                <Ionicons name="radio-outline" size={32} color="#00E5A0" />
              )}
            </View>
          </View>

          <Text style={styles.title}>
            {detected ? 'Deposit received' : 'Waiting for deposit'}
          </Text>
          <Text style={styles.subtitle}>
            {detected
              ? `${amount} ${sendCurrency} confirmed on ${network}`
              : `Send ${amount} ${sendCurrency} to complete this transfer`}
          </Text>

          {/* Amount badge */}
          <View style={styles.amountBadge}>
            <Text style={styles.amountBadgeText}>
              {amount} {sendCurrency} {'\u2192'} {symbol}{receiveAmount.toLocaleString()} {recvCurrency}
            </Text>
          </View>
        </View>

        {/* Steps timeline */}
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineStep}>
              {/* Connector line */}
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    step.state !== 'waiting' && styles.connectorActive,
                  ]}
                />
              )}
              <View style={styles.stepRow}>
                {/* Dot */}
                <View style={[
                  styles.stepDot,
                  step.state === 'active' && styles.stepDotActive,
                  step.state === 'done' && styles.stepDotDone,
                ]}>
                  {step.state === 'done' && (
                    <Ionicons name="checkmark" size={12} color="#111118" />
                  )}
                  {step.state === 'active' && (
                    <View style={styles.stepDotPulse} />
                  )}
                </View>
                {/* Text */}
                <View style={styles.stepText}>
                  <Text style={[
                    styles.stepLabel,
                    step.state === 'active' && styles.stepLabelActive,
                    step.state === 'done' && styles.stepLabelDone,
                  ]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          <Text style={styles.bottomNote}>
            {detected
              ? 'Processing your transfer\u2026'
              : 'You can leave the app \u2014 we\u2019ll notify you when we detect your deposit'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  container: { flex: 1, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  // Scan indicator
  scanWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseRing: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: '#00E5A0',
  },
  scanIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,229,160,0.08)', borderWidth: 2, borderColor: 'rgba(0,229,160,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanIconDone: {
    backgroundColor: 'rgba(0,229,160,0.15)', borderColor: '#00E5A0',
  },
  title: {
    fontFamily: 'Inter_800ExtraBold', fontSize: 22, letterSpacing: -0.3,
    color: '#FFFFF5', marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,245,0.6)',
    textAlign: 'center', lineHeight: 20, marginBottom: 16,
  },
  amountBadge: {
    backgroundColor: 'rgba(0,229,160,0.07)', borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18,
  },
  amountBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#00E5A0' },
  // Timeline
  timeline: { paddingHorizontal: 32, paddingVertical: 8 },
  timelineStep: { position: 'relative' },
  connector: {
    position: 'absolute', left: 10, top: -8, width: 2, height: 16,
    backgroundColor: 'rgba(255,255,245,0.08)',
  },
  connectorActive: { backgroundColor: 'rgba(0,229,160,0.4)' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 10 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, marginTop: 1,
    borderWidth: 2, borderColor: 'rgba(255,255,245,0.1)', backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: '#00E5A0', backgroundColor: 'rgba(0,229,160,0.12)' },
  stepDotDone: { borderColor: '#00E5A0', backgroundColor: '#00E5A0' },
  stepDotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E5A0' },
  stepText: { flex: 1 },
  stepLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,245,0.3)',
  },
  stepLabelActive: { color: '#FFFFF5', fontFamily: 'Inter_600SemiBold' },
  stepLabelDone: { color: '#00E5A0', fontFamily: 'Inter_600SemiBold' },
  stepDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.4)', marginTop: 2 },
  // Bottom
  bottom: { paddingHorizontal: 24, paddingBottom: 36 },
  bottomNote: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,245,0.35)',
    textAlign: 'center', lineHeight: 18,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '../../components/Icon';
import { CorridorWire, CTAButton, ProgressRail } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';

type Props = NativeStackScreenProps<SendFlowParamList, 'Tracking'>;

interface Step {
  label: string;
  desc: string;
  state: 'done' | 'active' | 'waiting';
  time: string;
}

const monoTime = StyleSheet.create({
  tabular: {
    ...typography.monoSm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontVariant: ['tabular-nums'],
  },
});

export const TrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientInitials = 'EJ',
    recipientMethod = 'OPay',
    recipientFlag = '\u{1F1F3}\u{1F1EC}',
    amount = 200,
    receiveAmount = 329000,
    dest,
  } = route.params || {};

  const symbol = dest?.symbol || '\u20A6';
  const { width: windowWidth } = useWindowDimensions();
  const wireWidth = Math.min(windowWidth - spacing(12), 360);

  const [progress, setProgress] = useState(0);
  const [etaSecs, setEtaSecs] = useState(118);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulseOpacity = useSharedValue(1);

  const [steps, setSteps] = useState<Step[]>([
    {
      label: 'Deposit received',
      desc: `${amount} USDT locked on Polygon`,
      state: 'done',
      time: 'Just now',
    },
    {
      label: 'Routing',
      desc: `Releasing to ${recipientMethod}`,
      state: 'active',
      time: 'In progress\u2026',
    },
    {
      label: 'Converting',
      desc: 'Fiat settlement in progress',
      state: 'waiting',
      time: 'Pending',
    },
    {
      label: 'Cash ready',
      desc: 'Recipient balance updated',
      state: 'waiting',
      time: 'Pending',
    },
  ]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1.5, 100);
        return next;
      });
      setEtaSecs((e) => Math.max(e - 1, 0));
    }, 1000);

    const t1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === 1) return { ...s, state: 'done' as const, time: '0:42' };
          if (i === 2) return { ...s, state: 'active' as const, time: 'In progress\u2026' };
          return s;
        })
      );
    }, 5000);

    const t2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === 2) return { ...s, state: 'done' as const, time: '1:18' };
          if (i === 3) return { ...s, state: 'active' as const, time: 'In progress\u2026' };
          return s;
        })
      );
    }, 10000);

    const t3 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === 3) return { ...s, state: 'done' as const, time: '1:52' };
          return s;
        })
      );
      setProgress(100);
      setTimeout(() => {
        navigation.replace('Success', {
          recipientName,
          recipientInitials,
          recipientMethod,
          recipientFlag,
          amount,
          receiveAmount,
          dest,
        });
      }, 1500);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    navigation,
    recipientName,
    recipientInitials,
    recipientMethod,
    recipientFlag,
    amount,
    receiveAmount,
    dest,
  ]);

  const formatEta = useCallback(() => {
    const m = Math.floor(etaSecs / 60);
    const s = etaSecs % 60;
    return ` ${m}:${s < 10 ? '0' : ''}${s}`;
  }, [etaSecs]);

  const bg = palette.grey[900];
  const textPrimary = palette.grey[100];
  const textSecondary = palette.grey[500];
  const textMuted = palette.grey[600];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bg }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          Transfer in progress
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wireWrap}>
          <CorridorWire width={wireWidth} height={40} progress={progress / 100} />
        </View>

        {/* Four-step status list — partial → positive as each completes */}
        <View style={styles.stepsContainer}>
          {steps.map((step, i) => (
            <View key={step.label} style={styles.step}>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: palette.grey[700] },
                    step.state === 'done' && {
                      backgroundColor: palette.status.positive,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.stepDot,
                  step.state === 'done' && {
                    backgroundColor: palette.status.positive,
                  },
                  step.state === 'active' && {
                    backgroundColor: palette.grey[800],
                    borderWidth: 2,
                    borderColor: palette.status.partial,
                  },
                  step.state === 'waiting' && {
                    backgroundColor: palette.grey[800],
                    borderWidth: 1,
                    borderColor: palette.grey[600],
                  },
                ]}
              >
                {step.state === 'done' ? (
                  <Ionicons name="checkmark" size={14} color={palette.grey[900]} />
                ) : (
                  <Text
                    style={[
                      styles.stepDotNum,
                      { color: textMuted },
                      step.state === 'active' && { color: palette.status.partial },
                      step.state === 'waiting' && { color: textMuted },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <View style={styles.stepBody}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.state === 'done' && { color: palette.status.positive },
                    step.state === 'active' && { color: palette.status.partial },
                    step.state === 'waiting' && { color: textMuted },
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={[styles.stepDesc, { color: textSecondary }]}>
                  {step.desc}
                </Text>
                <Text
                  style={[
                    monoTime.tabular,
                    step.state === 'done' && { color: palette.status.positive },
                    step.state === 'active' && { color: palette.status.partial },
                    step.state === 'waiting' && { color: textMuted },
                  ]}
                >
                  {step.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Hero */}
        <View style={styles.trackHero}>
          <Text style={[styles.thAmount, { color: textPrimary }]}>
            {symbol}
            {receiveAmount.toLocaleString()}
          </Text>
          <Text style={[styles.thSub, { color: textSecondary }]}>
            {'\u2192'} {recipientName} {'\u00B7'} {recipientMethod}
          </Text>

          <View
            style={[
              styles.thEta,
              progress >= 100
                ? { backgroundColor: palette.status.positive }
                : { backgroundColor: palette.grey[800] },
            ]}
          >
            {progress < 100 && (
              <Animated.View style={pulseStyle}>
                <View
                  style={[styles.ldot, { backgroundColor: palette.status.partial }]}
                />
              </Animated.View>
            )}
            {progress >= 100 ? (
              <Text style={[styles.thEtaText, { color: palette.grey[900] }]}>
                Delivered!
              </Text>
            ) : (
              <View style={styles.thEtaRow}>
                <Text style={[styles.thEtaText, { color: palette.status.partial }]}>
                  Est. delivery in
                </Text>
                <Text
                  style={[
                    styles.thEtaText,
                    monoTime.tabular,
                    { color: palette.status.partial },
                  ]}
                >
                  {formatEta()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <ProgressRail progress={progress / 100} height={8} />
          <Text style={[styles.progressPct, { color: textSecondary }]}>
            {Math.round(Math.min(progress, 100))}% complete
          </Text>
        </View>

        <View style={styles.ctaWrap}>
          <CTAButton
            title="Back to Home"
            ghost
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'Amount' }] })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(6),
    paddingTop: spacing(4.5),
    paddingBottom: spacing(1.5),
  },
  headerTitle: {
    flex: 1,
    ...typography.h5,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing(4) },
  wireWrap: {
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
    paddingHorizontal: spacing(6),
  },
  trackHero: {
    alignItems: 'center',
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
  },
  thAmount: {
    ...typography.display2,
    marginBottom: spacing(1),
  },
  thSub: {
    ...typography.bodySm,
    marginBottom: spacing(3),
  },
  thEta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderRadius: radii.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3.5),
    minHeight: 32,
  },
  thEtaText: {
    ...typography.captionMedium,
  },
  thEtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ldot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressWrap: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(5),
  },
  progressPct: {
    ...typography.monoSm,
    textAlign: 'right',
    marginTop: spacing(1.5),
  },
  stepsContainer: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(5),
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    width: 2,
    height: '100%',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotNum: {
    ...typography.captionMedium,
  },
  stepBody: {
    flex: 1,
    paddingTop: spacing(0.75),
    paddingBottom: spacing(5),
  },
  stepLabel: {
    ...typography.main14,
    marginBottom: spacing(0.5),
  },
  stepDesc: {
    ...typography.caption,
    lineHeight: 17,
  },
  ctaWrap: {
    paddingHorizontal: spacing(6),
    paddingBottom: spacing(6),
  },
});

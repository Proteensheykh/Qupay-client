import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QupayLogo, CTAButton } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OTP'>;

const DEMO_CODE = ['4', '8', '2', '9', '1', '6'];

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const [code, setCode] = useState<string[]>([]);
  const [resendTimer, setResendTimer] = useState(45);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleTapOTP = useCallback(() => {
    if (code.length >= 6) return;
    setCode((prev) => [...prev, DEMO_CODE[prev.length]]);
  }, [code.length]);

  const handleVerify = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to main app — handled by parent
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    }, 800);
  }, [navigation]);

  const codeComplete = code.length === 6;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.form}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={styles.headline}>
            Enter the{'\n'}
            <Text style={styles.greenText}>code</Text>
          </Text>
          <Text style={styles.desc}>Tap the boxes for a demo code.</Text>

          {/* OTP Grid */}
          <TouchableOpacity
            style={styles.otpGrid}
            onPress={handleTapOTP}
            activeOpacity={0.8}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.otpCell,
                  code[i] ? styles.otpCellFill : undefined,
                  !code[i] && i === code.length ? styles.otpCellCur : undefined,
                ]}
              >
                {code[i] ? (
                  <Text style={styles.otpDigit}>{code[i]}</Text>
                ) : i === code.length ? (
                  <View style={styles.curLine} />
                ) : null}
              </View>
            ))}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>
              Didn't get it?{' '}
              <Text
                style={styles.resendLink}
                onPress={() => {
                  setResendTimer(45);
                  setCode([]);
                }}
              >
                Resend
              </Text>
              {resendTimer > 0 && (
                <Text style={styles.resendTimer}>
                  {' '}
                  {'\u00B7'} 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <CTAButton
            title="Verify & Continue"
            onPress={handleVerify}
            disabled={!codeComplete}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  container: { flex: 1, justifyContent: 'space-between' },
  form: { paddingHorizontal: 28, paddingTop: 36 },
  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    letterSpacing: -0.3,
    color: '#FFFFF5',
    marginBottom: 8,
    lineHeight: 31,
  },
  greenText: { color: '#00E5A0' },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 24,
    lineHeight: 21,
  },
  otpGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  otpCell: {
    flex: 1,
    height: 58,
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFill: {
    borderColor: 'rgba(0,229,160,0.4)',
    backgroundColor: 'rgba(0,229,160,0.12)',
  },
  otpCellCur: {
    borderColor: '#00E5A0',
  },
  otpDigit: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    color: '#FFFFF5',
  },
  curLine: {
    width: 2,
    height: 24,
    backgroundColor: '#00E5A0',
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  resendLink: {
    color: '#00E5A0',
    fontFamily: 'Inter_600SemiBold',
  },
  resendTimer: {
    color: 'rgba(255,255,245,0.4)',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

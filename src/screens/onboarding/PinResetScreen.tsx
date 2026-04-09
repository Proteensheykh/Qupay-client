import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QupayLogo, CTAButton, Numpad } from '../../components';
import { completePinReset, resendOtp, getProfile } from '../../api/auth';
import { isApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PinReset'>;

const OTP_LENGTH = 6;
const PIN_LENGTH = 4;

type Step = 'otp' | 'newPin' | 'confirmPin';

export const PinResetScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { cooldownSeconds: initialCooldown } = route.params;
  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(initialCooldown);

  const setUser = useAuthStore((state) => state.setUser);
  const setPinLocked = useAuthStore((state) => state.setPinLocked);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const currentValue = step === 'otp' ? otp : step === 'newPin' ? newPin : confirmPin;
  const currentLength = step === 'otp' ? OTP_LENGTH : PIN_LENGTH;
  const setCurrentValue = step === 'otp' ? setOtp : step === 'newPin' ? setNewPin : setConfirmPin;

  const handleKey = useCallback((key: string) => {
    setError(null);
    if (key === 'del') {
      setCurrentValue((prev) => prev.slice(0, -1));
    } else if (currentValue.length < currentLength) {
      setCurrentValue((prev) => prev + key);
    }
  }, [currentValue, currentLength, setCurrentValue]);

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !user?.email) return;
    try {
      const response = await resendOtp({
        email: user.email,
        purpose: 'PIN_RESET',
      });
      setResendTimer(response.cooldownSeconds);
      setOtp('');
      setError(null);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to resend code';
      Alert.alert('Error', message);
    }
  }, [resendTimer, user?.email]);

  const handleContinue = useCallback(async () => {
    if (step === 'otp') {
      if (otp.length !== OTP_LENGTH) return;
      setStep('newPin');
      return;
    }

    if (step === 'newPin') {
      if (newPin.length !== PIN_LENGTH) return;
      setStep('confirmPin');
      return;
    }

    if (confirmPin !== newPin) {
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      await completePinReset({ otp, newPin });
      const profile = await getProfile();
      setUser(profile);
      setPinLocked(false);
      Alert.alert('Success', 'Your PIN has been reset successfully.', [
        { text: 'OK' },
      ]);
    } catch (err) {
      if (__DEV__) console.error('PIN reset error:', err);
      const message = isApiError(err) ? err.message : 'Failed to reset PIN';
      setError(message);
      if (message.toLowerCase().includes('otp') || message.toLowerCase().includes('code')) {
        setStep('otp');
        setOtp('');
        setNewPin('');
        setConfirmPin('');
      }
    } finally {
      setLoading(false);
    }
  }, [step, otp, newPin, confirmPin, setUser, setPinLocked]);

  const handleBack = useCallback(() => {
    if (step === 'confirmPin') {
      setStep('newPin');
      setConfirmPin('');
      setError(null);
    } else if (step === 'newPin') {
      setStep('otp');
      setNewPin('');
      setError(null);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const getHeadline = () => {
    switch (step) {
      case 'otp':
        return 'Enter the code';
      case 'newPin':
        return 'Create new PIN';
      case 'confirmPin':
        return 'Confirm PIN';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'otp':
        return `We sent a 6-digit code to ${user?.email}`;
      case 'newPin':
        return 'Set a new 4-digit PIN to secure your account';
      case 'confirmPin':
        return 'Enter your new PIN again to confirm';
    }
  };

  const isComplete = currentValue.length === currentLength;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            {getHeadline().split(' ').slice(0, -1).join(' ')}{'\n'}
            <Text style={{ color: theme.secondary.main }}>{getHeadline().split(' ').slice(-1)}</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>{getDescription()}</Text>
        </View>

        <View style={styles.pinArea}>
          <View style={styles.dotsRow}>
            {Array.from({ length: currentLength }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { borderColor: theme.text.muted },
                  currentValue.length > i && {
                    backgroundColor: theme.secondary.main,
                    borderColor: theme.secondary.main,
                  },
                  error && { borderColor: theme.error.main },
                ]}
              />
            ))}
          </View>
          {error && <Text style={[styles.errorText, { color: theme.error.main }]}>{error}</Text>}

          {step === 'otp' && (
            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: theme.text.secondary }]}>
                Didn't get it?{' '}
                <Text
                  style={[
                    styles.resendLink,
                    { color: theme.secondary.main },
                    resendTimer > 0 && { color: theme.text.muted },
                  ]}
                  onPress={handleResend}
                >
                  Resend
                </Text>
                {resendTimer > 0 && (
                  <Text style={{ color: theme.text.muted }}>
                    {' '}· 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <Numpad onKey={handleKey} />
          <View style={styles.btnRow}>
            <CTAButton
              title="Back"
              onPress={handleBack}
              ghost
              style={styles.btn}
            />
            <CTAButton
              title={step === 'confirmPin' ? 'Reset PIN' : 'Continue'}
              onPress={handleContinue}
              disabled={!isComplete}
              loading={loading}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  header: { paddingHorizontal: 28, paddingTop: 36 },
  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: 8,
    lineHeight: 31,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 21,
  },
  pinArea: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 16,
  },
  resendRow: {
    marginTop: 20,
  },
  resendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  resendLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});

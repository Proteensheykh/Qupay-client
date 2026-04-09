import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QupayLogo, CTAButton } from '../../components';
import { completeRegistration, resendOtp, getProfile } from '../../api/auth';
import { isApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OTP'>;

const OTP_LENGTH = 6;

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { phoneNumber, cooldownSeconds: initialCooldown, registrationPayload } = route.params;
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(initialCooldown);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 500, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, easing: Easing.step0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkAnim]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleCodeChange = useCallback((text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    setError(null);
  }, []);

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return;
    try {
      const response = await resendOtp({
        email: registrationPayload.email,
        purpose: 'REGISTRATION',
      });
      setResendTimer(response.cooldownSeconds);
      setCode('');
      setError(null);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to resend code';
      Alert.alert('Error', message);
    }
  }, [resendTimer, registrationPayload.email]);

  const handleVerify = useCallback(async () => {
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    setError(null);

    try {
      const response = await completeRegistration({
        phoneNumber,
        otp: code,
      });
      await setTokens(response);
      
      const profile = await getProfile();
      setUser(profile);

      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'PinSetup' as never }],
      });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [code, phoneNumber, navigation, setTokens, setUser]);

  const codeComplete = code.length === OTP_LENGTH;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <View style={styles.container}>
        <View style={styles.form}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Enter the{'\n'}
            <Text style={{ color: theme.secondary.main }}>code</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            We sent a 6-digit code to {registrationPayload.email}
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
          />

          <TouchableOpacity
            style={styles.otpGrid}
            onPress={focusInput}
            activeOpacity={0.8}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpCell,
                  { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
                  code[i] && !error && {
                    borderColor: theme.secondary.main,
                    backgroundColor: theme.info.bg,
                  },
                  !code[i] && i === code.length && !error && { borderColor: theme.secondary.main },
                  error && { borderColor: theme.error.main },
                ]}
              >
                {code[i] ? (
                  <Text style={[styles.otpDigit, { color: theme.text.primary }]}>{code[i]}</Text>
                ) : i === code.length ? (
                  <Animated.View style={[styles.curLine, { opacity: blinkAnim, backgroundColor: theme.secondary.main }]} />
                ) : null}
              </View>
            ))}
          </TouchableOpacity>

          {error && (
            <Text style={[styles.errorText, { color: theme.error.main }]}>{error}</Text>
          )}

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
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  form: { paddingHorizontal: 28, paddingTop: 36 },
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
    marginBottom: 24,
    lineHeight: 21,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  otpGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  otpCell: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
  },
  curLine: {
    width: 2,
    height: 24,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 20,
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
});

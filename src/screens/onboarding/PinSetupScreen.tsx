import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QupayLogo, CTAButton, Numpad } from '../../components';
import { setPin, getProfile } from '../../api/auth';
import { isApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PinSetup'>;

const PIN_LENGTH = 4;

export const PinSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [pinValue, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  const currentPin = step === 'create' ? pinValue : confirmPin;
  const setCurrentPin = step === 'create' ? setPinValue : setConfirmPin;

  const handleKey = useCallback((key: string) => {
    setError(null);
    if (key === 'del') {
      setCurrentPin((prev) => prev.slice(0, -1));
    } else if (currentPin.length < PIN_LENGTH) {
      setCurrentPin((prev) => prev + key);
    }
  }, [currentPin, setCurrentPin]);

  const handleContinue = useCallback(async () => {
    if (step === 'create') {
      if (pinValue.length !== PIN_LENGTH) return;
      setStep('confirm');
      return;
    }

    if (confirmPin !== pinValue) {
      setError('PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      await setPin({ pin: pinValue });
      const profile = await getProfile();
      setUser(profile);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      if (__DEV__) console.error('PIN setup error:', err);
      const message = isApiError(err) ? err.message : 'Failed to set PIN. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [step, pinValue, confirmPin, navigation, setUser]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError(null);
    }
  }, [step]);

  const isComplete = currentPin.length === PIN_LENGTH;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            {step === 'create' ? 'Create your' : 'Confirm your'}{'\n'}
            <Text style={{ color: theme.secondary.main }}>PIN</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            {step === 'create'
              ? 'Set a 4-digit PIN to secure your account'
              : 'Enter your PIN again to confirm'}
          </Text>
        </View>

        <View style={styles.pinArea}>
          <View style={styles.dotsRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { borderColor: theme.text.muted },
                  currentPin.length > i && {
                    backgroundColor: theme.secondary.main,
                    borderColor: theme.secondary.main,
                  },
                  error && { borderColor: theme.error.main },
                ]}
              />
            ))}
          </View>
          {error && <Text style={[styles.errorText, { color: theme.error.main }]}>{error}</Text>}
        </View>

        <View style={styles.bottom}>
          <Numpad onKey={handleKey} />
          <View style={styles.btnRow}>
            {step === 'confirm' && (
              <CTAButton
                title="Back"
                onPress={handleBack}
                ghost
                style={styles.btn}
              />
            )}
            <CTAButton
              title={step === 'create' ? 'Continue' : 'Set PIN'}
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
    gap: 20,
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

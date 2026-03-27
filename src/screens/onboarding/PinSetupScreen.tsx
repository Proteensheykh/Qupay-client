import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QupayLogo, CTAButton, Numpad } from '../../components';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PinSetup'>;

export const PinSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const currentPin = step === 'create' ? pin : confirmPin;
  const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

  const handleKey = useCallback(
    (key: string) => {
      setError('');
      if (key === 'del') {
        setCurrentPin((p) => p.slice(0, -1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (key === '' || currentPin.length >= 4) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const next = currentPin + key;
      setCurrentPin(next);

      if (next.length === 4) {
        if (step === 'create') {
          setTimeout(() => {
            setStep('confirm');
          }, 300);
        } else {
          if (next === pin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }, 400);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError('PINs don\u2019t match. Try again.');
            setTimeout(() => {
              setConfirmPin('');
            }, 600);
          }
        }
      }
    },
    [currentPin, step, pin, setCurrentPin, navigation]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={styles.headline}>
            {step === 'create' ? 'Set your' : 'Confirm your'}
            {'\n'}
            <Text style={styles.greenText}>transaction PIN</Text>
          </Text>
          <Text style={styles.desc}>
            {step === 'create'
              ? 'This 4-digit PIN secures every transfer you make.'
              : 'Enter the same PIN to confirm.'}
          </Text>

          {/* PIN dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  currentPin.length > i && styles.dotFilled,
                  error && currentPin.length > i && styles.dotError,
                ]}
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#FF4D6A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.errorRow}>
              <Ionicons name="lock-closed" size={13} color="rgba(255,255,245,0.3)" />
              <Text style={styles.hintText}>
                {step === 'create' ? 'Choose a PIN you\u2019ll remember' : 'Re-enter your 4-digit PIN'}
              </Text>
            </View>
          )}
        </View>

        <Numpad onKey={handleKey} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  container: { flex: 1, justifyContent: 'space-between' },
  top: { paddingHorizontal: 28, paddingTop: 36 },
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
    lineHeight: 21,
    marginBottom: 36,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,245,0.15)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  dotError: {
    backgroundColor: '#FF4D6A',
    borderColor: '#FF4D6A',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FF4D6A',
  },
  hintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.3)',
  },
});

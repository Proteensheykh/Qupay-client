// Legacy placeholder — onboarding now uses SplashScreen, SignUpScreen, OTPScreen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface WelcomeScreenProps {
  onComplete?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background.default }]}>
      <Text style={[styles.text, { color: theme.text.secondary }]}>Deprecated</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14 },
});

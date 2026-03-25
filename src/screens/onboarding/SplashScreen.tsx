import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QupayLogo, CTAButton } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <QupayLogo size={28} />
          <View style={styles.spacer} />
          <Text style={styles.headline}>
            Send crypto{'\n'}anywhere.{'\n'}
            <Text style={styles.greenText}>They get cash.</Text>
          </Text>
          <Text style={styles.description}>
            USDT converts to mobile money or bank transfer in under 2 minutes. Recipients need no
            crypto account.
          </Text>
          {/* Stats row */}
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>40+</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>&lt;2%</Text>
              <Text style={styles.statLabel}>Avg. fee</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>&lt;2 min</Text>
              <Text style={styles.statLabel}>Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <CTAButton
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.ctaBtn}
          />
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('SignUp')}>
              Log in
            </Text>
          </Text>
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={11} color="rgba(255,255,245,0.4)" />
            <Text style={styles.footerText}>Licensed & regulated globally</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111118',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  spacer: {
    height: 36,
  },
  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.5,
    color: '#FFFFF5',
    marginBottom: 12,
  },
  greenText: {
    color: '#00E5A0',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 23,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,245,0.08)',
  },
  statVal: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: '#00E5A0',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,245,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  ctaBtn: {
    marginBottom: 16,
  },
  loginText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginLink: {
    color: '#00E5A0',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,245,0.4)',
  },
});

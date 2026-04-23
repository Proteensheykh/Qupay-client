import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { QupayLogo, CTAButton, MuralBackdrop } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { useTheme, typography, radii } from '../../theme';
import { palette } from '../../theme/colors';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Splash'>;

const words = ['anyone', 'anywhere'];

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prev => (prev + 1) % words.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.marketing.ground }]}>
      <MuralBackdrop />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoMark}>
            <QupayLogo size={40} variant="mark" />
            <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: 42 }}>
              <View style={[styles.progressFill, { width: '42%' }]} />
            </View>
          </View>
          <View style={styles.spacer} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Quick payments,{'\n'}in any currency,{'\n'}
            <Text style={{ color: palette.royal[500] }}>
              to <Animated.Text style={{ opacity: fadeAnim }}>{words[currentIndex]}</Animated.Text>
            </Text>
          </Text>
          <Text style={[styles.description, { color: theme.text.secondary }]}>
            Send or receive money, in any currency, to & from anyone, anywhere, with just a mobile number.
          </Text>
          {/* Stats row */}
          <View
            style={[
              styles.statRow,
              {
                backgroundColor: theme.background.surface,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: palette.royal[500] }]}>54+</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Countries</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: palette.royal[500] }]}>No fees</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Zero cost</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: palette.royal[500] }]}>Quick</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <CTAButton
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.ctaBtn}
          />
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
            <Text style={[styles.loginText, { color: theme.text.secondary }]}>
              Already have an account? <Text style={[styles.loginLink, { color: palette.royal[500] }]}>Log in</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={11} color={theme.text.muted} />
            <Text style={[styles.footerText, { color: theme.text.muted }]}>Licensed & regulated globally</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  logoMark: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    marginTop: 20,
    width: 120,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.material.lightThin,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.royal[500],
  },
  spacer: {
    height: 36,
  },
  headline: {
    ...typography.h2,
    marginBottom: 12,
  },
  description: {
    ...typography.bodySm,
    lineHeight: 23,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    borderWidth: 1,
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
  },
  statVal: {
    ...typography.h4,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.labelXs,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  ctaBtn: {
    marginBottom: 16,
  },
  loginText: {
    ...typography.bodySm,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginLink: {
    ...typography.bodySm,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  footerText: {
    ...typography.monoXs,
  },
});

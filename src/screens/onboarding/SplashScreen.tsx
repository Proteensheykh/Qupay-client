import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { QupayLogo, CTAButton } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <QupayLogo size={28} />
          <View style={styles.spacer} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Quick payments,{'\n'}in any currency,{'\n'}
            <Text style={{ color: theme.secondary.main }}>
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
              <Text style={[styles.statVal, { color: theme.secondary.main }]}>54+</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Countries</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: theme.secondary.main }]}>No fees</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Zero cost</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: theme.secondary.main }]}>Quick</Text>
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
              Already have an account? <Text style={[styles.loginLink, { color: theme.secondary.main }]}>Log in</Text>
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
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
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
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
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
    textAlign: 'center',
    marginBottom: 20,
  },
  loginLink: {
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
  },
});

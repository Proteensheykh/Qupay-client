import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { QupayLogo, CTAButton, FormField, BottomSheet, Toast } from '../../components';
import { countries } from '../../data/mockData';
import { initiateRegistration } from '../../api/auth';
import { isApiError } from '../../api/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';
import type { InitiateRegistrationRequest } from '../../types/auth';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

type Step = 'personal' | 'security';

const TOTAL_STEPS = 2;
const STEP_INDEX: Record<Step, number> = { personal: 0, security: 1 };

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('personal');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const firstNameValid = firstName.trim().length >= 2;
  const lastNameValid = lastName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.length >= 8;
  const passwordValid = password.length >= 8;

  const personalStepValid = firstNameValid && lastNameValid && emailValid;
  const securityStepValid = phoneValid && passwordValid;
  const allFieldsValid = personalStepValid && securityStepValid;

  const getFieldError = (field: string): string | undefined => {
    if (fieldErrors[field]) return fieldErrors[field];
    if (!touched[field]) return undefined;

    switch (field) {
      case 'firstName':
        return !firstNameValid ? 'First name must be at least 2 characters' : undefined;
      case 'lastName':
        return !lastNameValid ? 'Last name must be at least 2 characters' : undefined;
      case 'email':
        return !emailValid ? 'Please enter a valid email address' : undefined;
      case 'phone':
        return !phoneValid ? 'Please enter a valid phone number' : undefined;
      case 'password':
        return !passwordValid ? 'Password must be at least 8 characters' : undefined;
      default:
        return undefined;
    }
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBack = () => {
    if (step === 'security') setStep('personal');
    else navigation.goBack();
  };

  const handleSubmitRegistration = useCallback(async () => {
    if (!allFieldsValid) return;
    setLoading(true);
    setShowError(false);

    const normalizedPhone = phone.replace(/^0+/, '');
    const phoneNumber = `${selectedCountry.code}${normalizedPhone}`;
    const registrationPayload: InitiateRegistrationRequest = {
      phoneNumber,
      countryCode: selectedCountry.iso,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const response = await initiateRegistration(registrationPayload);
      navigation.navigate('OTP', {
        phoneNumber,
        cooldownSeconds: response.cooldownSeconds,
        registrationPayload,
      });
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Something went wrong. Please try again.';
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('phone')) {
        setFieldErrors((prev) => ({ ...prev, phone: message }));
        setStep('security');
      } else if (lowerMessage.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
        setStep('personal');
      } else {
        setErrorMessage(message);
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [allFieldsValid, phone, selectedCountry, navigation, firstName, lastName, email, password]);

  const renderProgressDots = () => {
    const currentIndex = STEP_INDEX[step];
    return (
      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i <= currentIndex ? theme.secondary.main : `${theme.secondary.main}30` },
            ]}
          />
        ))}
      </View>
    );
  };

  // ─── Step 1: Personal info ───────────────────────────────────────────
  const renderPersonalStep = () => (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: theme.background.surface }]} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>

          <QupayLogo size={22} />
          <View style={{ height: 20 }} />
          {renderProgressDots()}

          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Create your{'\n'}
            <Text style={{ color: theme.secondary.main }}>account</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            Takes 30 seconds. Start sending crypto to cash instantly.
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Your name</Text>
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <FormField
                placeholder="First name"
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => markTouched('firstName')}
                maxLength={30}
                isValid={firstNameValid}
                error={getFieldError('firstName')}
                accessibilityLabel="First name"
              />
            </View>
            <View style={styles.nameField}>
              <FormField
                placeholder="Last name"
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => markTouched('lastName')}
                maxLength={30}
                isValid={lastNameValid}
                error={getFieldError('lastName')}
                accessibilityLabel="Last name"
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Email</Text>
          <FormField
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onBlur={() => markTouched('email')}
            maxLength={80}
            isValid={emailValid}
            error={getFieldError('email')}
            accessibilityLabel="Email address"
          />

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Continue"
          onPress={() => setStep('security')}
          disabled={!personalStepValid}
          style={styles.cta}
        />
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
          <Text style={[styles.switchText, { color: theme.text.secondary }]}>
            Already have an account?{' '}
            <Text style={[styles.switchLink, { color: theme.secondary.main }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Step 2: Security ───────────────────────────────────────────────
  const renderSecurityStep = () => (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: theme.background.surface }]} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>

          <QupayLogo size={22} />
          <View style={{ height: 20 }} />
          {renderProgressDots()}

          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Secure your{'\n'}
            <Text style={{ color: theme.secondary.main }}>account</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            We'll use your phone number for verification and recovery.
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Phone number</Text>
          <View
            style={[
              styles.phoneCard,
              {
                backgroundColor: theme.background.paper,
                borderColor: phoneFocused ? `${theme.secondary.main}66` : 'transparent',
              },
              phoneValid && !getFieldError('phone') && { borderColor: `${theme.secondary.main}80` },
              getFieldError('phone') ? { borderColor: `${theme.error.main}99` } : {},
            ]}
          >
            <TouchableOpacity
              style={styles.countryRow}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
              accessibilityLabel={`Country: ${selectedCountry.name}. Tap to change`}
              accessibilityRole="button"
            >
              <Text style={styles.prefixFlag}>{selectedCountry.flag}</Text>
              <Text style={[styles.countryNameInCard, { color: theme.text.primary }]}>{selectedCountry.name}</Text>
              <Text style={[styles.countryCodeInCard, { color: theme.text.secondary }]}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.text.muted} />
            </TouchableOpacity>

            <View style={[styles.phoneDivider, { backgroundColor: theme.divider }]} />

            <View style={styles.phoneInputRow}>
              <Text style={[styles.phonePrefix, { color: theme.text.secondary }]}>{selectedCountry.code}</Text>
              <TextInput
                style={[styles.phoneInput, { color: theme.text.primary }]}
                placeholder="Phone number"
                placeholderTextColor={theme.text.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                maxLength={12}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => {
                  setPhoneFocused(false);
                  markTouched('phone');
                }}
                accessibilityLabel="Phone number"
              />
              {phoneValid && !getFieldError('phone') && (
                <Ionicons name="checkmark-circle" size={20} color={theme.success.main} />
              )}
              {getFieldError('phone') && (
                <Ionicons name="alert-circle" size={16} color={theme.error.light} />
              )}
            </View>
          </View>
          {getFieldError('phone') && (
            <Text style={[styles.phoneError, { color: theme.error.light }]}>{getFieldError('phone')}</Text>
          )}

          <View style={{ height: 8 }} />

          <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Password</Text>
          <FormField
            placeholder="Create a password (min 8 characters)"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            onBlur={() => markTouched('password')}
            maxLength={64}
            isValid={passwordValid}
            error={getFieldError('password')}
            accessibilityLabel="Password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={theme.text.muted} />
              </TouchableOpacity>
            }
          />

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Continue"
          onPress={handleSubmitRegistration}
          disabled={!securityStepValid}
          loading={loading}
          style={styles.cta}
        />
        <Text style={[styles.termsText, { color: theme.text.secondary }]}>
          By continuing you agree to our{' '}
          <Text style={[styles.termsLink, { color: theme.secondary.main }]}>Terms</Text> and{' '}
          <Text style={[styles.termsLink, { color: theme.secondary.main }]}>Privacy Policy</Text>
        </Text>
      </View>

      <BottomSheet
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        title="Select Country"
      >
        {countries.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[
              styles.countryItem,
              { borderBottomColor: theme.inputBorder },
              selectedCountry.code === c.code && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => {
              setSelectedCountry(c);
              setShowCountryPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{c.flag}</Text>
            <View style={styles.countryInfo}>
              <Text style={[styles.countryName, { color: theme.text.primary }]}>{c.name}</Text>
              <Text style={[styles.countrySub, { color: theme.text.secondary }]}>{c.reg} {'\u00B7'} {c.code}</Text>
            </View>
            {selectedCountry.code === c.code && (
              <Ionicons name="checkmark" size={18} color={theme.secondary.main} />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]}>
      <Toast
        visible={showError}
        message={errorMessage}
        type="error"
        onDismiss={() => setShowError(false)}
      />
      {step === 'personal' && renderPersonalStep()}
      {step === 'security' && renderSecurityStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  form: { paddingHorizontal: 24, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },

  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.3,
    marginBottom: 8,
    lineHeight: 34,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },

  phoneCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prefixFlag: { fontSize: 20 },
  countryNameInCard: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  countryCodeInCard: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  phoneDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phonePrefix: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    padding: 0,
  },
  phoneError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -8,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cta: { marginBottom: 12 },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
    lineHeight: 18,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  switchText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  switchLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  countryFlag: { fontSize: 24 },
  countryInfo: { flex: 1 },
  countryName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  countrySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
});

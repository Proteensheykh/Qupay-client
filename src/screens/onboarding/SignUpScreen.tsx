import React, { useState, useCallback, useMemo } from 'react';
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
import { countries, banks, networks } from '../../data/mockData';
import { initiateRegistration } from '../../api/auth';
import { isApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';
import type { InitiateRegistrationRequest } from '../../types/auth';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

type Step = 1 | 2;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);

  const { setBankDetails, setWalletDetails, setUsername } = useAuthStore();

  const generatedUsername = useMemo(() => {
    const first = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const last = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!first && !last) return '';
    return `${first}${last}`;
  }, [firstName, lastName]);

  const firstNameValid = firstName.trim().length >= 2;
  const lastNameValid = lastName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.length >= 8;
  const passwordValid = password.length >= 8;
  const confirmPasswordValid = confirmPassword === password && confirmPassword.length > 0;
  const allFieldsValid = firstNameValid && lastNameValid && emailValid && phoneValid && passwordValid && confirmPasswordValid;

  const bankAccountValid = selectedBank && accountNumber.length >= 10;
  const walletValid = walletAddress.length >= 26 && selectedNetwork;

  const availableBanks = banks[selectedCountry.name] || banks['Nigeria'] || [];

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
      case 'confirmPassword':
        if (!confirmPassword) return 'Please confirm your password';
        return !confirmPasswordValid ? 'Passwords do not match' : undefined;
      default:
        return undefined;
    }
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleContinueToFinancial = () => {
    if (allFieldsValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmitRegistration = useCallback(async (saveFinancialDetails: boolean) => {
    if (!allFieldsValid) return;
    setLoading(true);
    setShowError(false);

    if (saveFinancialDetails) {
      if (bankAccountValid) {
        setBankDetails({ bankName: selectedBank!, accountNumber });
      }
      if (walletValid) {
        setWalletDetails({ address: walletAddress, network: selectedNetwork! });
      }
    }

    setUsername(generatedUsername);

    const normalizedPhone = phone.replace(/^0+/, '');
    const phoneNumber = `${selectedCountry.code}${normalizedPhone}`;
    const registrationPayload: InitiateRegistrationRequest = {
      phoneNumber,
      role: 'PAYER',
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
        setStep(1);
      } else if (lowerMessage.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
        setStep(1);
      } else {
        setErrorMessage(message);
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [
    allFieldsValid, phone, selectedCountry, navigation,
    firstName, lastName, email, password, bankAccountValid, walletValid,
    selectedBank, accountNumber, walletAddress, selectedNetwork,
    setBankDetails, setWalletDetails, setUsername, generatedUsername
  ]);

  const renderStep1 = () => (
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
          <View style={{ height: 28 }} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Create your{'\n'}
            <Text style={{ color: theme.secondary.main }}>account</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            Takes 30 seconds. Start sending crypto to cash instantly.
          </Text>

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <FormField
                label="First Name"
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
                label="Last Name"
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

          {generatedUsername.length > 0 && (
            <View
              style={[
                styles.usernamePreview,
                {
                  backgroundColor: theme.info.bg,
                  borderColor: theme.secondary.main,
                },
              ]}
            >
              <View style={[styles.usernameIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="at" size={16} color={theme.secondary.main} />
              </View>
              <View style={styles.usernameTextWrap}>
                <Text style={[styles.usernameLabel, { color: theme.text.muted }]}>Your username</Text>
                <Text style={[styles.usernameValue, { color: theme.secondary.main }]}>@{generatedUsername}</Text>
              </View>
              <View style={[styles.usernameBadge, { backgroundColor: theme.info.bg }]}>
                <Text style={[styles.usernameBadgeText, { color: theme.secondary.main }]}>Auto-generated</Text>
              </View>
            </View>
          )}

          <FormField
            label="Email Address"
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

          <Text style={[styles.phoneLabel, { color: theme.text.secondary }]}>Phone Number</Text>
          <View style={styles.phoneGroup}>
            <TouchableOpacity
              style={[
                styles.prefixBtn,
                {
                  backgroundColor: theme.background.surface,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
              accessibilityLabel={`Country: ${selectedCountry.name}. Tap to change`}
              accessibilityRole="button"
            >
              <Text style={styles.prefixFlag}>{selectedCountry.flag}</Text>
              <Text style={[styles.prefixCode, { color: theme.text.primary }]}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={12} color={theme.text.muted} />
            </TouchableOpacity>
            <View
              style={[
                styles.phoneField,
                {
                  backgroundColor: theme.background.surface,
                  borderColor: theme.inputBorder,
                },
                phoneFocused && { borderColor: theme.secondary.main },
                phoneValid && !getFieldError('phone') && { borderColor: theme.secondary.main },
                getFieldError('phone') && { borderColor: theme.error.main },
              ]}
            >
              <TextInput
                style={[styles.phoneInput, { color: theme.text.primary }]}
                placeholder="Enter number"
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
                <Ionicons name="checkmark" size={16} color={theme.secondary.main} />
              )}
              {getFieldError('phone') && (
                <Ionicons name="alert-circle" size={16} color={theme.error.light} />
              )}
            </View>
          </View>
          {getFieldError('phone') && (
            <Text style={[styles.phoneError, { color: theme.error.light }]}>{getFieldError('phone')}</Text>
          )}

          <FormField
            label="Password"
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

          <FormField
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => markTouched('confirmPassword')}
            maxLength={64}
            isValid={confirmPasswordValid}
            error={getFieldError('confirmPassword')}
            accessibilityLabel="Confirm password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={theme.text.muted} />
              </TouchableOpacity>
            }
          />

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Continue"
          onPress={handleContinueToFinancial}
          disabled={!allFieldsValid}
          style={styles.cta}
        />
        <Text style={[styles.termsText, { color: theme.text.secondary }]}>
          By continuing you agree to our{' '}
          <Text style={[styles.termsLink, { color: theme.secondary.main }]}>Terms</Text> and{' '}
          <Text style={[styles.termsLink, { color: theme.secondary.main }]}>Privacy Policy</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
          <Text style={[styles.switchText, { color: theme.text.secondary }]}>
            Already have an account?{' '}
            <Text style={[styles.switchLink, { color: theme.secondary.main }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
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
              setSelectedBank(null);
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

  const renderStep2 = () => (
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
          <View style={{ height: 28 }} />
          <Text style={[styles.headline, { color: theme.text.primary }]}>
            Almost done!{'\n'}
            <Text style={{ color: theme.secondary.main }}>Payment details</Text>
          </Text>
          <Text style={[styles.desc, { color: theme.text.secondary }]}>
            Add your payment details for faster transfers via @username. This is optional — you can add them later.
          </Text>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.background.paper,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="business-outline" size={18} color={theme.secondary.main} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Bank Account</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.text.muted }]}>For receiving local currency</Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Bank</Text>
            <TouchableOpacity
              style={[
                styles.selectField,
                {
                  backgroundColor: theme.background.surface,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowBankPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedBank ? [styles.selectValue, { color: theme.text.primary }] : [styles.selectPlaceholder, { color: theme.text.muted }]}>
                {selectedBank || 'Select your bank'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text.muted} />
            </TouchableOpacity>

            <FormField
              label="Account Number"
              placeholder="Enter account number"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
              maxLength={15}
              isValid={accountNumber.length >= 10}
              accessibilityLabel="Account number"
            />
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.background.paper,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="wallet-outline" size={18} color={theme.secondary.main} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>USDT Wallet</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.text.muted }]}>For receiving crypto payments</Text>
              </View>
            </View>

            <FormField
              label="Wallet Address"
              placeholder="0x..."
              autoCapitalize="none"
              autoCorrect={false}
              value={walletAddress}
              onChangeText={setWalletAddress}
              maxLength={66}
              isValid={walletAddress.length >= 26}
              accessibilityLabel="Wallet address"
            />

            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Network</Text>
            <TouchableOpacity
              style={[
                styles.selectField,
                {
                  backgroundColor: theme.background.surface,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedNetwork ? [styles.selectValue, { color: theme.text.primary }] : [styles.selectPlaceholder, { color: theme.text.muted }]}>
                {selectedNetwork || 'Select network'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Continue"
          onPress={() => handleSubmitRegistration(true)}
          loading={loading}
          style={styles.cta}
        />
        <TouchableOpacity
          onPress={() => handleSubmitRegistration(false)}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet
        visible={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        title="Select Bank"
      >
        {availableBanks.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[
              styles.pickerItem,
              { borderBottomColor: theme.inputBorder },
              selectedBank === bank.name && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => {
              setSelectedBank(bank.name);
              setShowBankPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerItemText, { color: theme.text.primary }]}>{bank.name}</Text>
            {bank.popular && (
              <Text style={[styles.popularBadge, { color: theme.secondary.main, backgroundColor: theme.info.bg }]}>Popular</Text>
            )}
            {selectedBank === bank.name && (
              <Ionicons name="checkmark" size={18} color={theme.secondary.main} />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      <BottomSheet
        visible={showNetworkPicker}
        onClose={() => setShowNetworkPicker(false)}
        title="Select Network"
      >
        {networks.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={[
              styles.pickerItem,
              { borderBottomColor: theme.inputBorder },
              selectedNetwork === network.name && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => {
              setSelectedNetwork(network.name);
              setShowNetworkPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={network.icon as any} size={20} color={theme.secondary.main} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerItemText, { color: theme.text.primary }]}>{network.name}</Text>
              <Text style={[styles.pickerItemSub, { color: theme.text.muted }]}>Gas: {network.gasEstimate}</Text>
            </View>
            {selectedNetwork === network.name && (
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
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  form: { paddingHorizontal: 28, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
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
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  usernamePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  usernameIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameTextWrap: {
    flex: 1,
  },
  usernameLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginBottom: 2,
  },
  usernameValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  usernameBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  usernameBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  phoneLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  phoneGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  prefixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  prefixFlag: { fontSize: 16 },
  prefixCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  phoneField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  phoneError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -6,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cta: { marginBottom: 12 },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 8,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  switchText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  switchLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  selectPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  pickerItemSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  popularBadge: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
});

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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

type Step = 1 | 2;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
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
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={styles.headline}>
            Create your{'\n'}
            <Text style={styles.greenText}>account</Text>
          </Text>
          <Text style={styles.desc}>
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
            <View style={styles.usernamePreview}>
              <View style={styles.usernameIconWrap}>
                <Ionicons name="at" size={16} color="#38BDF8" />
              </View>
              <View style={styles.usernameTextWrap}>
                <Text style={styles.usernameLabel}>Your username</Text>
                <Text style={styles.usernameValue}>@{generatedUsername}</Text>
              </View>
              <View style={styles.usernameBadge}>
                <Text style={styles.usernameBadgeText}>Auto-generated</Text>
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

          <Text style={styles.phoneLabel}>Phone Number</Text>
          <View style={styles.phoneGroup}>
            <TouchableOpacity
              style={styles.prefixBtn}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
              accessibilityLabel={`Country: ${selectedCountry.name}. Tap to change`}
              accessibilityRole="button"
            >
              <Text style={styles.prefixFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.prefixCode}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            <View
              style={[
                styles.phoneField,
                phoneFocused && styles.phoneFieldFocused,
                phoneValid && !getFieldError('phone') && styles.phoneFieldOk,
                getFieldError('phone') && styles.phoneFieldError,
              ]}
            >
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter number"
                placeholderTextColor="rgba(255,255,255,0.4)"
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
                <Ionicons name="checkmark" size={16} color="#38BDF8" />
              )}
              {getFieldError('phone') && (
                <Ionicons name="alert-circle" size={16} color="#F87171" />
              )}
            </View>
          </View>
          {getFieldError('phone') && (
            <Text style={styles.phoneError}>{getFieldError('phone')}</Text>
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
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.4)" />
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
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.4)" />
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
        <Text style={styles.termsText}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.switchLink}>Sign In</Text>
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
              selectedCountry.code === c.code && styles.countryItemSel,
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
              <Text style={styles.countryName}>{c.name}</Text>
              <Text style={styles.countrySub}>{c.reg} {'\u00B7'} {c.code}</Text>
            </View>
            {selectedCountry.code === c.code && (
              <Ionicons name="checkmark" size={18} color="#38BDF8" />
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
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={styles.headline}>
            Almost done!{'\n'}
            <Text style={styles.greenText}>Payment details</Text>
          </Text>
          <Text style={styles.desc}>
            Add your payment details for faster transfers via @username. This is optional — you can add them later.
          </Text>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="business-outline" size={18} color="#1A6FFF" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Bank Account</Text>
                <Text style={styles.sectionSubtitle}>For receiving local currency</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Bank</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowBankPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedBank ? styles.selectValue : styles.selectPlaceholder}>
                {selectedBank || 'Select your bank'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
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

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(56,189,248,0.12)' }]}>
                <Ionicons name="wallet-outline" size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>USDT Wallet</Text>
                <Text style={styles.sectionSubtitle}>For receiving crypto payments</Text>
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

            <Text style={styles.fieldLabel}>Network</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedNetwork ? styles.selectValue : styles.selectPlaceholder}>
                {selectedNetwork || 'Select network'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
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
          <Text style={styles.skipText}>Skip for now</Text>
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
              selectedBank === bank.name && styles.pickerItemSel,
            ]}
            onPress={() => {
              setSelectedBank(bank.name);
              setShowBankPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.pickerItemText}>{bank.name}</Text>
            {bank.popular && <Text style={styles.popularBadge}>Popular</Text>}
            {selectedBank === bank.name && (
              <Ionicons name="checkmark" size={18} color="#38BDF8" />
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
              selectedNetwork === network.name && styles.pickerItemSel,
            ]}
            onPress={() => {
              setSelectedNetwork(network.name);
              setShowNetworkPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={network.icon as any} size={20} color="#38BDF8" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerItemText}>{network.name}</Text>
              <Text style={styles.pickerItemSub}>Gas: {network.gasEstimate}</Text>
            </View>
            {selectedNetwork === network.name && (
              <Ionicons name="checkmark" size={18} color="#38BDF8" />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
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
  safe: { flex: 1, backgroundColor: '#0A0A0C' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  form: { paddingHorizontal: 28, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1F1F23',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    letterSpacing: -0.3,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 31,
  },
  greenText: { color: '#38BDF8' },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.6)',
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
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  usernameIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56,189,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameTextWrap: {
    flex: 1,
  },
  usernameLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  usernameValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#38BDF8',
  },
  usernameBadge: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  usernameBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#38BDF8',
  },
  phoneLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
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
    backgroundColor: '#1F1F23',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  prefixFlag: { fontSize: 16 },
  prefixCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  phoneField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F23',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  phoneFieldFocused: {
    borderColor: 'rgba(56,189,248,0.4)',
  },
  phoneFieldOk: {
    borderColor: 'rgba(56,189,248,0.5)',
  },
  phoneFieldError: {
    borderColor: 'rgba(255,107,107,0.6)',
  },
  phoneError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#F87171',
    marginBottom: 12,
    marginTop: -6,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingBottom: 8,
  },
  termsLink: {
    color: '#38BDF8',
    fontFamily: 'Inter_600SemiBold',
  },
  switchText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  switchLink: {
    color: '#38BDF8',
    fontFamily: 'Inter_600SemiBold',
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  countryItemSel: {
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  countryFlag: { fontSize: 24 },
  countryInfo: { flex: 1 },
  countryName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  countrySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(26,111,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F23',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerItemSel: {
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  pickerItemText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  pickerItemSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  popularBadge: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#38BDF8',
    backgroundColor: 'rgba(56,189,248,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
});

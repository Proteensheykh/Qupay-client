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
import { Ionicons } from '@expo/vector-icons';
import { QupayLogo, CTAButton, FormField, BottomSheet } from '../../components';
import { countries } from '../../data/mockData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const nameValid = fullName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.length >= 8;
  const allFieldsValid = nameValid && emailValid && phoneValid;

  const handleSendCode = useCallback(() => {
    if (!allFieldsValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTP', { phone: `${selectedCountry.code} ${phone}`, name: fullName.trim(), email: email.trim() });
    }, 800);
  }, [phone, allFieldsValid, selectedCountry, navigation, fullName, email]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <QupayLogo size={22} />
          <View style={{ height: 28 }} />
          <Text style={styles.headline}>
            Create your{'\n'}
            <Text style={styles.greenText}>account</Text>
          </Text>
          <Text style={styles.desc}>
            Takes 30 seconds. Start sending crypto to cash instantly.
          </Text>

          <FormField
            label="Full Name"
            placeholder="Enter your full name"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            maxLength={60}
            isValid={nameValid}
            accessibilityLabel="Full name"
          />

          <FormField
            label="Email Address"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            maxLength={80}
            isValid={emailValid}
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
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,245,0.4)" />
            </TouchableOpacity>
            <View
              style={[
                styles.phoneField,
                phoneFocused && styles.phoneFieldFocused,
                phoneValid && styles.phoneFieldOk,
              ]}
            >
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter number"
                placeholderTextColor="rgba(255,255,245,0.4)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                accessibilityLabel="Phone number"
              />
              {phoneValid && (
                <Ionicons name="checkmark" size={16} color="#00E5A0" />
              )}
            </View>
          </View>

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Send Code"
          onPress={handleSendCode}
          disabled={!allFieldsValid}
          loading={loading}
          style={styles.cta}
        />
        <Text style={styles.termsText}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      {/* Country Picker */}
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
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{c.flag}</Text>
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{c.name}</Text>
              <Text style={styles.countrySub}>{c.reg} {'\u00B7'} {c.code}</Text>
            </View>
            {selectedCountry.code === c.code && (
              <Ionicons name="checkmark" size={18} color="#00E5A0" />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  form: { paddingHorizontal: 28, paddingTop: 36 },
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
    lineHeight: 21,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 24,
  },
  phoneLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
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
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  prefixFlag: { fontSize: 16 },
  prefixCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
  },
  phoneField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  phoneFieldFocused: {
    borderColor: 'rgba(0,229,160,0.4)',
  },
  phoneFieldOk: {
    borderColor: 'rgba(0,229,160,0.5)',
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFF5',
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
    color: 'rgba(255,255,245,0.6)',
    textAlign: 'center',
    paddingBottom: 8,
  },
  termsLink: {
    color: '#00E5A0',
    fontFamily: 'Inter_600SemiBold',
  },
  // Country picker items
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  countryItemSel: {
    backgroundColor: 'rgba(0,229,160,0.08)',
  },
  countryFlag: { fontSize: 24 },
  countryInfo: { flex: 1 },
  countryName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
  },
  countrySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 1,
  },
});

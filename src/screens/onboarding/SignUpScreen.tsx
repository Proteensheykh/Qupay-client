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
import { QupayLogo, CTAButton, BottomSheet } from '../../components';
import { countries } from '../../data/mockData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

const quickPicks = ['SG', 'UK', 'US', 'UAE', 'NG'];
const quickPickMap: Record<string, string> = {
  SG: 'Singapore',
  UK: 'United Kingdom',
  US: 'United States',
  UAE: 'UAE',
  NG: 'Nigeria',
};
const quickPickFlags: Record<string, string> = {
  SG: '\u{1F1F8}\u{1F1EC}',
  UK: '\u{1F1EC}\u{1F1E7}',
  US: '\u{1F1FA}\u{1F1F8}',
  UAE: '\u{1F1E6}\u{1F1EA}',
  NG: '\u{1F1F3}\u{1F1EC}',
};

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phone, setPhone] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneValid = phone.length >= 8;

  const handleSendCode = useCallback(() => {
    if (!phoneValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTP', { phone: `${selectedCountry.code} ${phone}` });
    }, 800);
  }, [phone, phoneValid, selectedCountry, navigation]);

  const selectCountry = useCallback(
    (c: (typeof countries)[0]) => {
      setSelectedCountry(c);
      setShowCountryPicker(false);
    },
    []
  );

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
            Where are you{'\n'}
            <Text style={styles.greenText}>sending from?</Text>
          </Text>
          <Text style={styles.desc}>
            30 seconds. We'll verify your ID after your first transfer — send immediately within Tier
            1 limits.
          </Text>

          <Text style={styles.sectionLabel}>Your Country</Text>
          <TouchableOpacity
            style={styles.countryRow}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{selectedCountry.name}</Text>
              <Text style={styles.countryReg}>
                {selectedCountry.reg} {'\u00B7'} {selectedCountry.code}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.6)" />
          </TouchableOpacity>

          {/* Quick picks */}
          <View style={styles.quickRow}>
            {quickPicks.map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.quickChip}
                onPress={() => {
                  const c = countries.find(
                    (cn) => cn.name === quickPickMap[code]
                  );
                  if (c) setSelectedCountry(c);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.quickText}>
                  {quickPickFlags[code]} {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Phone Number</Text>
          <View style={styles.phoneGroup}>
            <TouchableOpacity
              style={styles.prefixBtn}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.prefixFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.prefixCode}>{selectedCountry.code}</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.phoneField,
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
              />
              {phoneValid && (
                <Ionicons name="checkmark" size={16} color="#00E5A0" />
              )}
            </View>
          </View>

          {/* Compliance note */}
          <View style={styles.compNote}>
            <Text style={styles.compTitle}>
              {selectedCountry.flag} {selectedCountry.name} {'\u00B7'}{' '}
              {selectedCountry.reg}
            </Text>
            <Text style={styles.compBody}>
              Identity verification required. We'll ask for a government ID — complete it after your
              first transfer if you're within Tier 1 limits.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <CTAButton
          title="Send Code"
          onPress={handleSendCode}
          disabled={!phoneValid}
          loading={loading}
          style={styles.cta}
        />
        <Text style={styles.termsText}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      {/* Country Picker Sheet */}
      <BottomSheet
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        title="Select Country"
      >
        {countries.map((c) => (
          <TouchableOpacity
            key={c.name}
            style={[
              styles.cpItem,
              selectedCountry.name === c.name && styles.cpItemSel,
            ]}
            onPress={() => selectCountry(c)}
            activeOpacity={0.7}
          >
            <Text style={styles.cpFlag}>{c.flag}</Text>
            <View style={styles.cpInfo}>
              <Text style={styles.cpName}>{c.name}</Text>
              <Text style={styles.cpSub}>
                {c.reg} {'\u00B7'} {c.code}
              </Text>
            </View>
            {selectedCountry.name === c.name && (
              <Text style={styles.cpCheck}>{'\u2713'}</Text>
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
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  countryFlag: { fontSize: 22 },
  countryInfo: { flex: 1 },
  countryName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
  },
  countryReg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 1,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  quickText: { fontSize: 12, color: '#FFFFF5' },
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
  compNote: {
    backgroundColor: 'rgba(26,111,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(26,111,255,0.15)',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
  },
  compTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFF5',
    marginBottom: 2,
  },
  compBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    color: '#93c5fd',
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
  cpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  cpItemSel: {
    backgroundColor: 'rgba(0,229,160,0.12)',
  },
  cpFlag: { fontSize: 24, width: 32, textAlign: 'center' },
  cpInfo: { flex: 1 },
  cpName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
  },
  cpSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  cpCheck: {
    fontSize: 16,
    color: '#00E5A0',
    fontFamily: 'Inter_700Bold',
  },
});

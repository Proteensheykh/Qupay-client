import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, GradientAvatar, CTAButton, BottomSheet } from '../../components';
import { banks } from '../../data/mockData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'Recipient'>;

const contacts = [
  { name: 'Emeka Johnson', initials: 'EJ', colors: ['#1a6fff', '#00e5a0'] as [string, string], method: 'OPay', phone: '0812 456 7890', flag: '\u{1F1F3}\u{1F1EC}', country: 'Nigeria' },
  { name: 'Kofi Mensah', initials: 'KM', colors: ['#ff9f43', '#00e5a0'] as [string, string], method: 'MTN Momo', phone: '0541 234 567', flag: '\u{1F1EC}\u{1F1ED}', country: 'Ghana' },
  { name: 'Adaeze Obi', initials: 'AO', colors: ['#a855f7', '#1a6fff'] as [string, string], method: 'GTBank', phone: '\u00B7\u00B7\u00B7\u00B7 4521', flag: '\u{1F1F3}\u{1F1EC}', country: 'Nigeria' },
];

export const RecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const dest = route.params?.dest;
  const [inputVal, setInputVal] = useState('');
  const [resolveState, setResolveState] = useState<'idle' | 'resolving' | 'resolved' | 'error'>('idle');
  const [resolvedContact, setResolvedContact] = useState<(typeof contacts)[0] | null>(null);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const destCountry = dest?.name || 'Nigeria';
  const countryBanks = banks[destCountry] || [];
  const bankFormValid = selectedBank && bankAccountNumber.length >= 8 && bankAccountName.trim().length >= 2;

  const handleInput = useCallback(
    (val: string) => {
      setInputVal(val);
      if (val.length >= 10) {
        setResolveState('resolving');
        setResolvedContact(null);
        setTimeout(() => {
          // Simulate: numbers starting with 0 resolve, others error
          if (val.startsWith('0')) {
            setResolveState('resolved');
            setResolvedContact(contacts[0]);
          } else {
            setResolveState('error');
          }
        }, 1200);
      } else {
        setResolveState('idle');
        setResolvedContact(null);
      }
    },
    []
  );

  const selectContact = useCallback(
    (c: (typeof contacts)[0]) => {
      navigation.navigate('Amount', {
        recipientName: c.name,
        recipientInitials: c.initials,
        recipientColors: c.colors,
        recipientMethod: c.method,
        recipientPhone: c.phone,
        recipientFlag: c.flag,
        dest,
      });
    },
    [navigation, dest]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Who are you sending to?" />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Smart input card */}
        <View style={[styles.sendInputCard, resolveState !== 'idle' && styles.sendInputCardActive]}>
          <View style={styles.sicField}>
            <Text style={styles.sicLabel}>To</Text>
            <TextInput
              style={styles.sicInput}
              placeholder="Name, phone number, or account\u2026"
              placeholderTextColor="rgba(255,255,245,0.4)"
              value={inputVal}
              onChangeText={handleInput}
            />
          </View>

          {/* Resolving state */}
          {resolveState === 'resolving' && (
            <View style={styles.resolvingRow}>
              <View style={styles.miniSpin} />
              <Text style={styles.resolvingText}>Looking up account\u2026</Text>
            </View>
          )}

          {/* Error state */}
          {resolveState === 'error' && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color="#FF4D6A" />
              <View style={styles.errorInfo}>
                <Text style={styles.errorTitle}>Account not found</Text>
                <Text style={styles.errorSub}>Check the number and try again, or add bank details below</Text>
              </View>
            </View>
          )}

          {/* Resolved state */}
          {resolveState === 'resolved' && resolvedContact && (
            <TouchableOpacity
              style={styles.resolvedRow}
              onPress={() => selectContact(resolvedContact)}
              activeOpacity={0.7}
            >
              <View style={styles.resolvedCard}>
                <GradientAvatar
                  initials={resolvedContact.initials}
                  size={36}
                  colors={resolvedContact.colors}
                  fontSize={12}
                />
                <View style={styles.rcInfo}>
                  <Text style={styles.rcName}>{resolvedContact.name}</Text>
                  <Text style={styles.rcSub}>
                    {resolvedContact.method} {'\u00B7'} {resolvedContact.phone} {'\u00B7'}{' '}
                    {resolvedContact.country}
                  </Text>
                  <Text style={styles.noAcctNote}>
                    No Qupay account needed — they'll receive a standard{' '}
                    {resolvedContact.method} credit {'\u2713'}
                  </Text>
                </View>
              </View>
              <Text style={styles.rcCheck}>{'\u2713'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add bank account for non-Qupay users */}
        <TouchableOpacity
          style={styles.addBankBtn}
          onPress={() => setShowBankSheet(true)}
          activeOpacity={0.7}
        >
          <View style={styles.addBankIcon}>
            <Ionicons name="business-outline" size={18} color="#00E5A0" />
          </View>
          <View style={styles.addBankInfo}>
            <Text style={styles.addBankTitle}>No Qupay account?</Text>
            <Text style={styles.addBankSub}>Enter bank account details to send directly</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
        </TouchableOpacity>

        {/* Recent contacts */}
        <Text style={styles.sectionLabel}>Recent</Text>
        <View style={styles.contactList}>
          {contacts.map((c) => (
            <TouchableOpacity
              key={c.initials}
              style={styles.contactItem}
              onPress={() => selectContact(c)}
              activeOpacity={0.7}
            >
              <View style={styles.ciAvWrap}>
                <GradientAvatar
                  initials={c.initials}
                  size={44}
                  colors={c.colors}
                  fontSize={13}
                />
                <View style={styles.ciFlag}>
                  <Text style={styles.ciFlagText}>{c.flag}</Text>
                </View>
              </View>
              <View style={styles.ciInfo}>
                <Text style={styles.ciName}>{c.name}</Text>
                <Text style={styles.ciSub}>
                  {c.method} {'\u00B7'} {c.phone} {'\u00B7'} {c.country}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {/* Bank Account Entry Sheet */}
      <BottomSheet
        visible={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        title="Enter Bank Details"
      >
        <View style={styles.bankForm}>
          <Text style={styles.bankFormNote}>
            Send to a bank account — no Qupay account needed
          </Text>

          <Text style={styles.bankLabel}>Select Bank</Text>
          <View style={styles.bankPicker}>
            {countryBanks.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.bankChip,
                  selectedBank === b.id && styles.bankChipSelected,
                ]}
                onPress={() => {
                  setSelectedBank(b.id);
                  setBankName(b.name);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.bankChipText,
                    selectedBank === b.id && styles.bankChipTextSelected,
                  ]}
                >
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.bankLabel}>Account Number</Text>
          <TextInput
            style={styles.bankInput}
            placeholder="Enter account number"
            placeholderTextColor="rgba(255,255,245,0.4)"
            keyboardType="number-pad"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            maxLength={20}
          />

          <Text style={styles.bankLabel}>Account Holder Name</Text>
          <TextInput
            style={styles.bankInput}
            placeholder="Enter account holder name"
            placeholderTextColor="rgba(255,255,245,0.4)"
            autoCapitalize="words"
            value={bankAccountName}
            onChangeText={setBankAccountName}
            maxLength={60}
          />

          <CTAButton
            title="Continue"
            disabled={!bankFormValid}
            onPress={() => {
              setShowBankSheet(false);
              const initials = bankAccountName
                .trim()
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              navigation.navigate('Amount', {
                recipientName: bankAccountName.trim(),
                recipientInitials: initials,
                recipientColors: ['#1a6fff', '#00e5a0'],
                recipientMethod: bankName,
                recipientPhone: bankAccountNumber,
                recipientFlag: dest?.flag || '\u{1F1F3}\u{1F1EC}',
                dest,
              });
            }}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ height: 40 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  sendInputCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendInputCardActive: {
    borderColor: 'rgba(0,229,160,0.4)',
  },
  sicField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sicLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,245,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: 30,
  },
  sicInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#FFFFF5',
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,245,0.08)',
  },
  miniSpin: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,229,160,0.2)',
    borderTopColor: '#00E5A0',
    borderRadius: 7,
  },
  resolvingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,245,0.08)',
  },
  resolvedCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rcInfo: { flex: 1 },
  rcName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  rcSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  noAcctNote: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#00E5A0',
    marginTop: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,77,106,0.15)',
    backgroundColor: 'rgba(255,77,106,0.05)',
  },
  errorInfo: { flex: 1 },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FF4D6A',
  },
  errorSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.5)',
    marginTop: 2,
  },
  rcCheck: {
    fontSize: 18,
    color: '#00E5A0',
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginHorizontal: 24,
    marginBottom: 10,
  },
  contactList: {
    marginHorizontal: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  ciAvWrap: { position: 'relative' },
  ciFlag: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#111118',
    borderWidth: 1.5,
    borderColor: '#111118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ciFlagText: { fontSize: 12 },
  ciInfo: { flex: 1 },
  ciName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
  },
  ciSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  // Add bank button
  addBankBtn: {
    marginHorizontal: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,229,160,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.15)',
    borderRadius: 12,
  },
  addBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,160,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBankInfo: { flex: 1 },
  addBankTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#00E5A0',
  },
  addBankSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 1,
  },
  // Bank form
  bankForm: {
    paddingHorizontal: 24,
  },
  bankFormNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 16,
  },
  bankLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 8,
  },
  bankPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bankChip: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  bankChipSelected: {
    borderColor: '#00E5A0',
    backgroundColor: 'rgba(0,229,160,0.12)',
  },
  bankChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  bankChipTextSelected: {
    color: '#00E5A0',
  },
  bankInput: {
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFF5',
    marginBottom: 16,
  },
});

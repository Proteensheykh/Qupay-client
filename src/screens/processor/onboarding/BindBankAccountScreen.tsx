import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, CTAButton, FormField, BottomSheet } from '../../../components';
import { Ionicons } from '../../../components/Icon';
import { getBanks, type BankResponse } from '../../../api/banks';
import { bindBankAccount } from '../../../api/users';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../hooks/useUser';
import { getApiErrorMessage } from '../../../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../../navigation/AppNavigator';
import { palette } from '../../../theme/colors';
import { radii } from '../../../theme/radii';
import { borders } from '../../../theme/elevation';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'BindBankAccount'>;

export const BindBankAccountScreen: React.FC<Props> = ({ navigation }) => {
  const toast = useToast();
  const { user, invalidate } = useUser();
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankResponse | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const accountValid = accountNumber.replace(/\D/g, '').length >= 10;
  const allValid = !!selectedBank && accountValid;
  const alreadyBound = (user?.bankAccounts?.length ?? 0) > 0;

  useEffect(() => {
    let mounted = true;
    getBanks()
      .then((data) => { if (mounted) setBanks(data); })
      .catch(() => { if (mounted) toast.error('Failed to load banks'); })
      .finally(() => { if (mounted) setBanksLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allValid || !selectedBank) return;
    setLoading(true);
    try {
      await bindBankAccount({
        bankCode: selectedBank.bankCode,
        accountNumber: accountNumber.replace(/\D/g, ''),
      });
      await invalidate();
      toast.success('Bank account bound successfully');
      navigation.goBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [allValid, selectedBank, accountNumber, invalidate, toast, navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      <ScreenHeader title="Bank Account" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
                <Ionicons name="business-outline" size={18} color={palette.royal[500]} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: palette.grey[300] }]}>Nigerian Bank Account</Text>
                <Text style={[styles.sectionSub, { color: palette.grey[500] }]}>
                  For receiving NGN settlements
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: palette.grey[500] }]}>Bank</Text>
            <TouchableOpacity
              style={[
                styles.selectField,
                {
                  backgroundColor: palette.grey[900],
                  borderColor: selectedBank ? palette.royal[500] : palette.grey[700],
                },
              ]}
              onPress={() => setShowBankPicker(true)}
              activeOpacity={0.7}
              disabled={banksLoading}
            >
              {banksLoading ? (
                <ActivityIndicator size="small" color={palette.grey[500]} />
              ) : (
                <>
                  <Text
                    style={[
                      selectedBank ? styles.selectValue : styles.selectPlaceholder,
                      { color: selectedBank ? palette.grey[300] : palette.grey[600] },
                    ]}
                  >
                    {selectedBank?.bankName || 'Select your bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.grey[500]} />
                </>
              )}
            </TouchableOpacity>

            <FormField
              label="Account Number"
              placeholder="Enter 10-digit account number"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
              maxLength={10}
              isValid={accountValid}
              accessibilityLabel="Account Number"
            />
          </View>

          {alreadyBound && (
            <View style={[styles.infoCard, { backgroundColor: 'rgba(122,232,112,0.08)', borderColor: palette.grey[700] }]}>
              <Ionicons name="checkmark-circle" size={16} color={palette.status.positive} />
              <Text style={[styles.infoText, { color: palette.grey[400] }]}>
                Current: {user?.bankAccounts?.[0]?.accountName} ({user?.bankAccounts?.[0]?.bankName})
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomArea, { borderTopColor: palette.material.lightThin }]}>
          <CTAButton
            title={alreadyBound ? 'Update Bank Account' : 'Bind Bank Account'}
            onPress={handleSubmit}
            disabled={!allValid}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        title="Select Bank"
      >
        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
          {banks.map((bank) => (
            <TouchableOpacity
              key={bank.bankCode}
              style={[
                styles.pickerItem,
                { borderBottomColor: palette.grey[700] },
                selectedBank?.bankCode === bank.bankCode && { backgroundColor: 'rgba(158,121,210,0.08)' },
              ]}
              onPress={() => {
                setSelectedBank(bank);
                setShowBankPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, { color: palette.grey[300] }]}>
                {bank.bankName}
              </Text>
              {selectedBank?.bankCode === bank.bankCode && (
                <Ionicons name="checkmark" size={18} color={palette.royal[500]} />
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  card: { padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTextWrap: { flex: 1, marginLeft: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  sectionSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
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
  selectValue: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  selectPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pickerScroll: { maxHeight: 400 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  pickerItemText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15 },
});

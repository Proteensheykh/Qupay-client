import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { CTAButton, FormField, BottomSheet, Toast } from '../../components';
import { banks, networks } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';

export const ProcessorOnboardingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user, setUser, bankDetails, walletDetails, setBankDetails, setWalletDetails } = useAuthStore();

  const [nin, setNin] = useState('');
  const [address, setAddress] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(bankDetails?.bankName ?? null);
  const [accountNumber, setAccountNumber] = useState(bankDetails?.accountNumber ?? '');
  const [walletAddress, setWalletAddress] = useState(walletDetails?.address ?? '');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(walletDetails?.network ?? null);

  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const availableBanks = banks['Nigeria'] || [];

  const ninValid = nin.replace(/\D/g, '').length >= 11;
  const addressValid = address.trim().length >= 10;
  const bankAccountValid = !!selectedBank && accountNumber.length >= 10;
  const walletValid = walletAddress.length >= 26 && !!selectedNetwork;

  const allFieldsValid = ninValid && addressValid && bankAccountValid && walletValid;

  const handleSubmit = async () => {
    if (!allFieldsValid || !user) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setBankDetails({ bankName: selectedBank!, accountNumber });
      setWalletDetails({ address: walletAddress, network: selectedNetwork! });

      const updatedUser = {
        ...user,
        role: 'BOTH' as const,
      };
      setUser(updatedUser);

      setShowSuccess(true);
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                state: {
                  routes: [{ name: 'ProcessorTab' }],
                },
              },
            ],
          })
        );
      }, 1500);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <Toast
        visible={showSuccess}
        message="You're now a Processor! The PROCESS tab is now available."
        type="success"
        onDismiss={() => setShowSuccess(false)}
      />
      <Toast
        visible={showError}
        message={errorMessage}
        type="error"
        onDismiss={() => setShowError(false)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: theme.background.surface }]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
            </TouchableOpacity>

            <View style={styles.titleWrap}>
              <View style={[styles.iconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.secondary.main} />
              </View>
              <Text style={[styles.headline, { color: theme.text.primary }]}>Become a Processor</Text>
              <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
                Complete verification to start earning by settling transactions
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.background.paper, borderColor: theme.inputBorder },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="person-outline" size={18} color={theme.secondary.main} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Identity Verification</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.text.secondary }]}>
                  KYC information required
                </Text>
              </View>
            </View>

            <FormField
              label="National ID Number (NIN)"
              placeholder="Enter your 11-digit NIN"
              keyboardType="number-pad"
              value={nin}
              onChangeText={(text) => setNin(text.replace(/\D/g, ''))}
              maxLength={11}
              isValid={ninValid}
              accessibilityLabel="National ID Number"
            />

            <FormField
              label="Residential Address"
              placeholder="Enter your full address"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
              isValid={addressValid}
              accessibilityLabel="Residential Address"
              style={styles.addressInput}
            />
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.background.paper, borderColor: theme.inputBorder },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="business-outline" size={18} color={theme.info.main} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Bank Account</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.text.secondary }]}>
                  For receiving settlements
                </Text>
              </View>
              {bankDetails && (
                <View style={[styles.prefillBadge, { backgroundColor: theme.info.bg }]}>
                  <Text style={[styles.prefillBadgeText, { color: theme.secondary.main }]}>Pre-filled</Text>
                </View>
              )}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Bank</Text>
            <TouchableOpacity
              style={[
                styles.selectField,
                {
                  backgroundColor: theme.background.surface,
                  borderColor: bankAccountValid ? theme.secondary.main : theme.inputBorder,
                },
              ]}
              onPress={() => setShowBankPicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  selectedBank ? styles.selectValue : styles.selectPlaceholder,
                  {
                    color: selectedBank ? theme.text.primary : theme.text.muted,
                  },
                ]}
              >
                {selectedBank || 'Select your bank'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text.muted} />
            </TouchableOpacity>

            <FormField
              label="Account Number"
              placeholder="Enter 10-digit account number"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
              maxLength={10}
              isValid={accountNumber.length >= 10}
              accessibilityLabel="Account Number"
            />
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.background.paper, borderColor: theme.inputBorder },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="wallet-outline" size={18} color={theme.secondary.main} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>USDT Wallet</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.text.secondary }]}>
                  For receiving crypto payments
                </Text>
              </View>
              {walletDetails && (
                <View style={[styles.prefillBadge, { backgroundColor: theme.info.bg }]}>
                  <Text style={[styles.prefillBadgeText, { color: theme.secondary.main }]}>Pre-filled</Text>
                </View>
              )}
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
                  borderColor: walletValid ? theme.secondary.main : theme.inputBorder,
                },
              ]}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  selectedNetwork ? styles.selectValue : styles.selectPlaceholder,
                  {
                    color: selectedNetwork ? theme.text.primary : theme.text.muted,
                  },
                ]}
              >
                {selectedNetwork || 'Select network'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text.muted} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.info.bg, borderColor: theme.inputBorder },
            ]}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.info.main} />
            <Text style={[styles.infoText, { color: theme.text.secondary }]}>
              Your information will be verified. Once approved, you'll be able to accept and settle transactions from the PROCESS tab.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={[styles.bottomArea, { borderTopColor: theme.divider }]}>
          <CTAButton
            title="Apply to become a Processor"
            onPress={handleSubmit}
            disabled={!allFieldsValid}
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
                <Text
                  style={[
                    styles.popularBadge,
                    { color: theme.secondary.main, backgroundColor: theme.info.bg },
                  ]}
                >
                  Popular
                </Text>
              )}
              {selectedBank === bank.name && (
                <Ionicons name="checkmark" size={18} color={theme.secondary.main} />
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
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
            <Ionicons
              name={network.icon as any}
              size={20}
              color={theme.secondary.main}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerItemText, { color: theme.text.primary }]}>{network.name}</Text>
              <Text style={[styles.pickerItemSub, { color: theme.text.secondary }]}>
                Gas: {network.gasEstimate}
              </Text>
            </View>
            {selectedNetwork === network.name && (
              <Ionicons name="checkmark" size={18} color={theme.secondary.main} />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleWrap: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTextWrap: {
    flex: 1,
    marginLeft: 12,
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
  prefillBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  prefillBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
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
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pickerScroll: {
    maxHeight: 400,
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

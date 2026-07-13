import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Avatar, CTAButton, BottomSheet } from '../../components';
import { getBanks, validateBankAccount } from '../../api/banks';
import type { BankResponse } from '../../api/banks';
import { validateWallet } from '../../api/wallets';
import { isApiError } from '../../api/client';
import { useRecentRecipientsStore, type BankRecipient, type WalletRecipient } from '../../store/recentRecipientsStore';
import { getPublicProfile } from '../../api/users';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';

type Props = NativeStackScreenProps<SendFlowParamList, 'Recipient'>;


const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const BASE58_ALPHABET = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

const isValidSolanaAddress = (addr: string): boolean => {
  return addr.length >= 32 && addr.length <= 44 && BASE58_ALPHABET.test(addr);
};

const truncateAddress = (addr: string): string => {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}\u2026${addr.slice(-6)}`;
};

export const RecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const { amount, sendCurrency, receiveCurrency, receiveAmount, amountType } = route.params;
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const isCryptoOut = receiveCurrency === 'USDT';

  const recents = useRecentRecipientsStore((s) => s.recents);
  const bankRecents = useMemo(
    () =>
      recents
        .filter((r) => r.channel === 'bank')
        .sort((a, b) => b.lastUsedAt - a.lastUsedAt),
    [recents]
  );
  const walletRecents = useMemo(
    () =>
      recents
        .filter((r) => r.channel === 'wallet')
        .sort((a, b) => b.lastUsedAt - a.lastUsedAt),
    [recents]
  );

  // Fiat-out state (bank)
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showBankListSheet, setShowBankListSheet] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Crypto-out state (wallet - Solana only)
  const [walletAddress, setWalletAddress] = useState('');
  const [walletAddressTouched, setWalletAddressTouched] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameLookupState, setUsernameLookupState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [resolvedWallet, setResolvedWallet] = useState('');

  // Banks from API
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);

  // Bank validation state
  const [bankValidationState, setBankValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [bankValidationError, setBankValidationError] = useState('');

  // Wallet validation state
  const [walletValidationState, setWalletValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [walletValidationError, setWalletValidationError] = useState('');

  useEffect(() => {
    let mounted = true;
    getBanks()
      .then((data) => {
        if (mounted) setBanks(data);
      })
      .catch(() => {
        // Keep empty array on error
      })
      .finally(() => {
        if (mounted) setBanksLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const validateBankDetails = useCallback(async () => {
    if (!selectedBank || bankAccountNumber.length < 10) {
      return;
    }

    setBankValidationState('validating');
    setBankValidationError('');
    setBankAccountName('');

    try {
      const result = await validateBankAccount({
        bankCode: selectedBank,
        accountNumber: bankAccountNumber,
      });
      if (!result.accountName) {
        setBankValidationError('Account not found. Please check the details and try again.');
        setBankValidationState('invalid');
        return;
      }
      setBankAccountName(result.accountName);
      setBankValidationState('valid');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Could not verify account details';
      setBankValidationError(message);
      setBankValidationState('invalid');
    }
  }, [selectedBank, bankAccountNumber]);

  const handleAccountNumberChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '');
    setBankAccountNumber(digits);
    if (bankValidationState !== 'idle') {
      setBankValidationState('idle');
      setBankAccountName('');
      setBankValidationError('');
    }
  }, [bankValidationState]);

  const handleAccountNumberBlur = useCallback(() => {
    if (selectedBank && bankAccountNumber.length === 10) {
      validateBankDetails();
    }
  }, [selectedBank, bankAccountNumber, validateBankDetails]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const search = bankSearch.toLowerCase();
    return banks.filter((b) => b.bankName.toLowerCase().includes(search));
  }, [banks, bankSearch]);

  const bankFormValid = selectedBank && bankAccountNumber.length === 10 && bankValidationState === 'valid' && (bankAccountName ?? '').trim().length >= 2;

  const walletAddressValid = isValidSolanaAddress(walletAddress);
  const walletAddressError = walletAddressTouched && walletAddress.length > 0 && !walletAddressValid;

  const selectBank = useCallback((bank: BankResponse) => {
    setSelectedBank(bank.bankCode);
    setBankName(bank.bankName);
    setShowBankListSheet(false);
    setBankSearch('');
    // Reset validation when bank changes
    if (bankAccountNumber.length === 10) {
      setBankValidationState('idle');
      setBankAccountName('');
      setBankValidationError('');
    }
  }, [bankAccountNumber]);

  const validateWalletAddress = useCallback(async (address: string) => {
    if (!isValidSolanaAddress(address)) return;

    setWalletValidationState('validating');
    setWalletValidationError('');

    try {
      const result = await validateWallet({ address, network: 'SOLANA' });
      if (result.valid) {
        setWalletValidationState('valid');
      } else {
        setWalletValidationError('This wallet address could not be verified');
        setWalletValidationState('invalid');
      }
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : 'Could not verify wallet address';
      setWalletValidationError(message);
      setWalletValidationState('invalid');
    }
  }, []);

  const handleWalletAddressChange = useCallback((val: string) => {
    setWalletAddress(val);
    setWalletAddressTouched(true);
    if (walletValidationState !== 'idle') {
      setWalletValidationState('idle');
      setWalletValidationError('');
    }
  }, [walletValidationState]);

  const handlePasteAddress = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      const trimmed = text.trim();
      setWalletAddress(trimmed);
      setWalletAddressTouched(true);
      if (isValidSolanaAddress(trimmed)) {
        validateWalletAddress(trimmed);
      }
    }
  }, [validateWalletAddress]);

  const handleUsernameLookup = useCallback(async () => {
    if (!usernameInput.trim()) return;
    setUsernameLookupState('loading');
    try {
      const profile = await getPublicProfile(usernameInput.trim());
      if ((profile as any).walletAddress) {
        const resolved = (profile as any).walletAddress;
        setResolvedWallet(resolved);
        setWalletAddress(resolved);
        setUsernameLookupState('found');
        validateWalletAddress(resolved);
      } else {
        setUsernameLookupState('error');
      }
    } catch {
      setUsernameLookupState('error');
    }
  }, [usernameInput, validateWalletAddress]);

  const selectBankRecent = useCallback(
    (r: BankRecipient) => {
      const initials = r.accountName
        .trim()
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      navigation.navigate('Confirm', {
        amount,
        sendCurrency,
        receiveCurrency,
        receiveAmount,
        amountType,
        recipientName: r.accountName,
        recipientInitials: initials,
        recipientColors: [palette.royal[600], palette.royal[500]],
        recipientMethod: r.bankName,
        recipientPhone: r.accountNumber,
        recipientFlag: '\u{1F1F3}\u{1F1EC}',
        recipientBankCode: r.bankCode,
        recipientAccountNumber: r.accountNumber,
        recipientAccountName: r.accountName,
      });
    },
    [navigation, amount, sendCurrency, receiveCurrency, receiveAmount, amountType]
  );

  const selectWalletRecent = useCallback(
    (r: WalletRecipient, label: string) => {
      navigation.navigate('Confirm', {
        amount,
        sendCurrency,
        receiveCurrency,
        receiveAmount,
        amountType,
        recipientName: label,
        recipientInitials: 'WA',
        recipientColors: [palette.royal[500], palette.royal[600]],
        recipientMethod: 'Solana',
        recipientFlag: '\u{1FA99}',
        recipientWalletAddress: r.walletAddress,
        recipientNetwork: 'Solana',
      });
    },
    [navigation, amount, sendCurrency, receiveCurrency, receiveAmount, amountType]
  );

  const handleWalletAddressBlur = useCallback(() => {
    if (isValidSolanaAddress(walletAddress) && walletValidationState === 'idle') {
      validateWalletAddress(walletAddress);
    }
  }, [walletAddress, walletValidationState, validateWalletAddress]);

  const handleContinueWithWallet = useCallback(() => {
    if (walletValidationState !== 'valid') return;
    navigation.navigate('Confirm', {
      amount,
      sendCurrency,
      receiveCurrency,
      receiveAmount,
      amountType,
      recipientName: truncateAddress(walletAddress),
      recipientInitials: 'WA',
      recipientColors: [palette.royal[500], palette.royal[600]],
      recipientMethod: 'Solana',
      recipientFlag: '\u{1FA99}',
      recipientWalletAddress: walletAddress,
      recipientNetwork: 'Solana',
    });
  }, [navigation, amount, sendCurrency, receiveCurrency, receiveAmount, amountType, walletAddress, walletValidationState]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="Who are you sending to?" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Swap summary — hairline rows on flat backdrop (no row cards) */}
        <View style={styles.swapSummary}>
          <View style={[styles.swapRow, styles.swapRowFirst]}>
            <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>Sending</Text>
            <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
              {sendSymbol}
              {amount.toLocaleString()} {sendCurrency}
            </Text>
          </View>
          <View style={styles.swapArrow}>
            <Ionicons name="arrow-down" size={14} color={palette.grey[500]} />
          </View>
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>They receive</Text>
            <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
              {isCryptoOut
                ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
          </View>
        </View>

        {isCryptoOut ? (
          <>
            {/* Network badge (Solana only) */}
            <View
              style={[
                styles.networkSelector,
                { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
              ]}
            >
              <View style={styles.networkSelectorLeft}>
                <Text style={[styles.networkSelectorLabel, { color: palette.grey[500] }]}>Network</Text>
                <View
                  style={[
                    styles.networkPill,
                    { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
                  ]}
                >
                  <Ionicons name="ellipse" size={10} color={palette.royal[500]} />
                  <Text style={[styles.networkPillText, { color: palette.grey[900] }]}>Solana</Text>
                </View>
              </View>
            </View>

            {/* Username lookup */}
            <View style={[styles.walletInputCard, { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin }]}>
              <Text style={[styles.walletInputLabel, { color: palette.grey[500] }]}>Lookup by username (optional)</Text>
              <View style={styles.usernameLookupRow}>
                <TextInput
                  style={[styles.walletInput, { color: palette.grey[900], backgroundColor: palette.grey[100], borderColor: palette.material.darkThin, flex: 1 }]}
                  placeholder="Enter Qupay username"
                  placeholderTextColor={palette.grey[500]}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.lookupBtn, { backgroundColor: palette.royal[500] }]}
                  onPress={handleUsernameLookup}
                  activeOpacity={0.7}
                  disabled={!usernameInput.trim()}
                >
                  {usernameLookupState === 'loading' ? (
                    <ActivityIndicator size="small" color={palette.grey[100]} />
                  ) : (
                    <Ionicons name="search" size={16} color={palette.grey[100]} />
                  )}
                </TouchableOpacity>
              </View>
              {usernameLookupState === 'found' && (
                <View style={styles.walletValidRow}>
                  <Ionicons name="checkmark-circle" size={14} color={palette.royal[500]} />
                  <Text style={[styles.walletValidText, { color: palette.royal[500] }]}>Wallet found and auto-filled</Text>
                </View>
              )}
              {usernameLookupState === 'error' && (
                <View style={styles.walletErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={palette.status.negative} />
                  <Text style={[styles.walletErrorText, { color: palette.status.negative }]}>User not found or no wallet configured</Text>
                </View>
              )}
            </View>

            {/* Wallet Address Input */}
            <View
              style={[
                styles.walletInputCard,
                { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
                walletAddressError && { borderColor: palette.status.negative },
                walletValidationState === 'valid' && { borderColor: palette.royal[500] },
                walletValidationState === 'invalid' && { borderColor: palette.status.negative },
              ]}
            >
              <View style={styles.walletInputHeader}>
                <Text style={[styles.walletInputLabel, { color: palette.grey[500] }]}>Solana Wallet Address</Text>
                <TouchableOpacity
                  onPress={handlePasteAddress}
                  style={[styles.pasteBtn, { backgroundColor: palette.grey[100], borderWidth: 1, borderColor: palette.material.darkThin }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={14} color={palette.grey[900]} />
                  <Text style={[styles.pasteBtnText, { color: palette.grey[900] }]}>Paste</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.walletInput,
                  { color: palette.grey[900], backgroundColor: palette.grey[100], borderColor: palette.material.darkThin },
                ]}
                placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5..."
                placeholderTextColor={palette.grey[500]}
                value={walletAddress}
                onChangeText={handleWalletAddressChange}
                onBlur={handleWalletAddressBlur}
                autoCapitalize="none"
                autoCorrect={false}
                editable={walletValidationState !== 'validating'}
              />
              {walletAddressError && (
                <View style={styles.walletErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={palette.status.negative} />
                  <Text style={[styles.walletErrorText, { color: palette.status.negative }]}>Invalid Solana address (32-44 base58 characters)</Text>
                </View>
              )}
              {walletValidationState === 'validating' && (
                <View style={styles.walletValidRow}>
                  <ActivityIndicator size="small" color={palette.royal[500]} />
                  <Text style={[styles.walletValidText, { color: palette.royal[500] }]}>Verifying wallet address…</Text>
                </View>
              )}
              {walletValidationState === 'valid' && (
                <View style={styles.walletValidRow}>
                  <Ionicons name="checkmark-circle" size={14} color={palette.royal[500]} />
                  <Text style={[styles.walletValidText, { color: palette.royal[500] }]}>Verified wallet address</Text>
                </View>
              )}
              {walletValidationState === 'invalid' && (
                <View style={styles.walletErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={palette.status.negative} />
                  <Text style={[styles.walletErrorText, { color: palette.status.negative }]}>{walletValidationError || 'Invalid wallet address'}</Text>
                </View>
              )}
            </View>

            {/* Continue Button */}
            <View style={styles.walletContinueWrap}>
              <CTAButton
                title="Continue"
                disabled={walletValidationState !== 'valid'}
                loading={walletValidationState === 'validating'}
                onPress={handleContinueWithWallet}
              />
            </View>

            {/* Recent wallets */}
            {walletRecents.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Recent</Text>
                <View style={styles.contactList}>
                  {walletRecents.map((r, index) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.contactItem, index === walletRecents.length - 1 && styles.contactItemLast]}
                      onPress={() => selectWalletRecent(r.data as WalletRecipient, r.label)}
                      activeOpacity={0.7}
                    >
                      <Avatar seed={r.label} size={44} />
                      <View style={styles.ciInfo}>
                        <Text style={[styles.ciName, { color: palette.grey[900] }]}>{r.label}</Text>
                        <View style={styles.walletSubRow}>
                          <Text style={[styles.walletAddrText, { color: palette.grey[500] }]}>{truncateAddress((r.data as WalletRecipient).walletAddress)}</Text>
                          <View style={[styles.networkBadge, { backgroundColor: palette.grey[100], borderWidth: 1, borderColor: palette.material.darkThin }]}>
                            <Ionicons name="ellipse" size={8} color={palette.royal[500]} />
                            <Text style={[styles.networkBadgeText, { color: palette.grey[900] }]}>Solana</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            {/* Bank Transfer entry */}
            <TouchableOpacity
              style={[
                styles.addBankBtn,
                { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
              ]}
              onPress={() => setShowBankSheet(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.addBankIcon, { backgroundColor: palette.grey[100], borderWidth: 1, borderColor: palette.material.darkThin }]}>
                <Ionicons name="business-outline" size={18} color={palette.grey[900]} />
              </View>
              <View style={styles.addBankInfo}>
                <Text style={[styles.addBankTitle, { color: palette.grey[900] }]}>Bank Transfer</Text>
                <Text style={[styles.addBankSub, { color: palette.grey[500] }]}>Send directly to a Nigerian bank account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
            </TouchableOpacity>

            {/* Recent bank recipients */}
            {bankRecents.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Recent</Text>
                <View style={styles.contactList}>
                  {bankRecents.map((r, index) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.contactItem, index === bankRecents.length - 1 && styles.contactItemLast]}
                      onPress={() => selectBankRecent(r.data as BankRecipient)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ciAvWrap}>
                        <Avatar seed={r.label} size={44} />
                        <View
                          style={[styles.ciFlag, { backgroundColor: palette.grey[100], borderColor: palette.material.darkThin }]}
                        >
                          <Text style={styles.ciFlagText}>{'\u{1F1F3}\u{1F1EC}'}</Text>
                        </View>
                      </View>
                      <View style={styles.ciInfo}>
                        <Text style={[styles.ciName, { color: palette.grey[900] }]}>{r.label}</Text>
                        <Text style={[styles.ciSub, { color: palette.grey[500] }]}>
                          {(r.data as BankRecipient).bankName} · {(r.data as BankRecipient).accountNumber}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>


      {/* Bank Account Entry Sheet */}
      <BottomSheet
        visible={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        title="Enter Bank Details"
      >
        <View style={styles.bankForm}>
          <Text style={[styles.bankLabel, { color: palette.grey[500] }]}>Select Bank</Text>
          <TouchableOpacity
            style={[
              styles.bankDropdown,
              { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
              selectedBank && { borderColor: palette.royal[500] },
            ]}
            onPress={() => setShowBankListSheet(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={selectedBank ? palette.royal[500] : palette.grey[500]}
            />
            <Text
              style={[
                styles.bankDropdownText,
                { color: selectedBank ? palette.grey[900] : palette.grey[500] },
              ]}
            >
              {bankName || 'Choose a bank...'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={palette.grey[500]} />
          </TouchableOpacity>


          <Text style={[styles.bankLabel, { color: palette.grey[500] }]}>Account Number</Text>
          <View style={styles.accountNumberRow}>
            <TextInput
              style={[
                styles.bankInput,
                styles.accountNumberInput,
                {
                  backgroundColor: palette.grey[200],
                  borderColor: bankValidationState === 'valid' 
                    ? palette.royal[500] 
                    : bankValidationState === 'invalid' 
                      ? palette.status.negative 
                      : palette.material.darkThin,
                  color: palette.grey[900],
                },
              ]}
              placeholder="Enter 10-digit account number"
              placeholderTextColor={palette.grey[500]}
              keyboardType="number-pad"
              value={bankAccountNumber}
              onChangeText={handleAccountNumberChange}
              onBlur={handleAccountNumberBlur}
              maxLength={10}
              editable={bankValidationState !== 'validating'}
            />
            {bankValidationState === 'validating' && (
              <View style={styles.validationIndicator}>
                <ActivityIndicator size="small" color={palette.royal[500]} />
              </View>
            )}
            {bankValidationState === 'valid' && (
              <View style={styles.validationIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={palette.royal[500]} />
              </View>
            )}
            {bankValidationState === 'invalid' && (
              <View style={styles.validationIndicator}>
                <Ionicons name="alert-circle" size={20} color={palette.status.negative} />
              </View>
            )}
          </View>
          {bankValidationState === 'invalid' && (
            <Text style={[styles.validationErrorText, { color: palette.status.negative }]}>
              {bankValidationError || 'Invalid account details'}
            </Text>
          )}

          <Text style={[styles.bankLabel, { color: palette.grey[500] }]}>Account Holder Name</Text>
          <View
            style={[
              styles.bankInput,
              styles.accountNameDisplay,
              {
                backgroundColor: palette.grey[200],
                borderColor: bankValidationState === 'valid' ? palette.royal[500] : palette.material.darkThin,
              },
            ]}
          >
            {bankValidationState === 'validating' ? (
              <Text style={[styles.accountNamePlaceholder, { color: palette.grey[500] }]}>
                Verifying account...
              </Text>
            ) : bankAccountName ? (
              <Text style={[styles.accountNameText, { color: palette.grey[900] }]}>
                {bankAccountName}
              </Text>
            ) : (
              <Text style={[styles.accountNamePlaceholder, { color: palette.grey[500] }]}>
                {bankValidationState === 'invalid' ? '—' : 'Will be auto-filled after verification'}
              </Text>
            )}
          </View>

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
              navigation.navigate('Confirm', {
                amount,
                sendCurrency,
                receiveCurrency,
                receiveAmount,
                amountType,
                recipientName: bankAccountName.trim(),
                recipientInitials: initials,
                recipientColors: [palette.royal[600], palette.royal[500]],
                recipientMethod: bankName,
                recipientPhone: bankAccountNumber,
                recipientFlag: '\u{1F1F3}\u{1F1EC}',
                recipientBankCode: selectedBank!,
                recipientAccountNumber: bankAccountNumber,
                recipientAccountName: bankAccountName.trim(),
              });
            }}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* Bank Selection Sheet */}
      <BottomSheet
        visible={showBankListSheet}
        onClose={() => {
          setShowBankListSheet(false);
          setBankSearch('');
        }}
        title="Select Bank"
      >
        <View style={styles.bankListContainer}>
          <View
            style={[
              styles.bankSearchWrap,
              { backgroundColor: palette.grey[200], borderColor: palette.material.darkThin },
            ]}
          >
            <Ionicons name="search" size={18} color={palette.grey[500]} />
            <TextInput
              style={[styles.bankSearchInput, { color: palette.grey[900] }]}
              placeholder="Search banks..."
              placeholderTextColor={palette.grey[500]}
              value={bankSearch}
              onChangeText={setBankSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {bankSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBankSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={palette.grey[500]} />
              </TouchableOpacity>
            )}
          </View>
          {banksLoading ? (
            <View style={styles.emptyList}>
              <ActivityIndicator size="large" color={palette.royal[500]} />
            </View>
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.bankCode}
              style={styles.bankList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bankListItem,
                    { borderBottomColor: palette.material.darkThin },
                    selectedBank === item.bankCode && [styles.bankListItemSelected, { backgroundColor: palette.grey[200] }],
                  ]}
                  onPress={() => selectBank(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bankListIcon, { backgroundColor: palette.material.darkThin }]}>
                    <Ionicons
                      name="business"
                      size={16}
                      color={selectedBank === item.bankCode ? palette.royal[500] : palette.grey[500]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.bankListName,
                      { color: selectedBank === item.bankCode ? palette.royal[500] : palette.grey[900] },
                    ]}
                  >
                    {item.bankName}
                  </Text>
                  {selectedBank === item.bankCode && <Ionicons name="checkmark" size={18} color={palette.royal[500]} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Ionicons name="search-outline" size={32} color={palette.grey[500]} />
                  <Text style={[styles.emptyListText, { color: palette.grey[500] }]}>No banks found</Text>
                </View>
              }
            />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  swapSummary: {
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  swapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: palette.material.darkThin,
  },
  swapRowFirst: {
    marginBottom: 4,
  },
  swapArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  swapLabel: {
    ...typography.subheader2,
    color: palette.grey[500],
  },
  swapValue: {
    ...typography.main14,
    fontVariant: ['tabular-nums'],
  },
  networkSelector: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  networkSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkSelectorLabel: {
    ...typography.subheader2,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  networkPillText: {
    ...typography.bodySm,
  },
  networkGas: {
    ...typography.helperText,
  },
  walletInputCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
  },
  walletInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletInputLabel: {
    ...typography.label,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  pasteBtnText: {
    ...typography.labelSm,
    textTransform: 'none',
    letterSpacing: 0,
  },
  walletInput: {
    ...typography.monoSm,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  walletErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  walletErrorText: {
    ...typography.helperText,
  },
  walletValidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  walletValidText: {
    ...typography.helperText,
  },
  walletContinueWrap: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  usernameLookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  lookupBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  walletAddrText: {
    ...typography.monoXs,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  networkBadgeText: {
    ...typography.labelXs,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: palette.material.darkThin,
  },
  networkItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkItemInfo: {
    flex: 1,
  },
  networkItemName: {
    ...typography.main14,
  },
  networkItemGas: {
    ...typography.helperText,
    marginTop: 2,
  },
  sendInputPill: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  sicField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 52,
  },
  sicSearchIcon: {
    marginTop: 1,
  },
  sicInput: {
    flex: 1,
    ...typography.bodySm,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: palette.material.darkThin,
  },
  miniSpin: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 7,
  },
  resolvingText: {
    ...typography.secondary12,
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: palette.material.darkThin,
  },
  resolvedCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rcInfo: { flex: 1 },
  rcName: {
    ...typography.main14,
  },
  rcSub: {
    ...typography.secondary12,
  },
  noAcctNote: {
    ...typography.helperText,
    marginTop: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: palette.material.darkThin,
  },
  errorInfo: { flex: 1 },
  errorTitle: {
    ...typography.main14,
  },
  errorSub: {
    ...typography.secondary12,
    marginTop: 2,
  },
  rcCheck: {
    ...typography.h3,
  },
  sectionLabel: {
    ...typography.label,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.material.darkThin,
  },
  contactItemLast: {
    borderBottomWidth: 0,
  },
  ciAvWrap: { position: 'relative' },
  ciFlag: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: palette.material.darkThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ciFlagText: { fontSize: 12 },
  ciInfo: { flex: 1 },
  ciName: {
    ...typography.main14,
  },
  ciSub: {
    ...typography.secondary12,
  },
  addBankBtn: {
    marginHorizontal: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  addBankIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBankInfo: { flex: 1 },
  addBankTitle: {
    ...typography.main14,
  },
  addBankSub: {
    ...typography.secondary12,
    marginTop: 1,
  },
  bankForm: {
    paddingHorizontal: 24,
  },
  bankLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  bankDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bankDropdownText: {
    flex: 1,
    ...typography.bodySm,
  },
  bankInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...typography.bodySm,
    marginBottom: 16,
  },
  accountNumberRow: {
    position: 'relative',
  },
  accountNumberInput: {
    paddingRight: 44,
  },
  validationIndicator: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  validationErrorText: {
    ...typography.bodySm,
    marginTop: -12,
    marginBottom: 16,
  },
  accountNameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  accountNameText: {
    ...typography.bodySm,
  },
  accountNamePlaceholder: {
    ...typography.bodySm,
  },
  bankListContainer: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  bankSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bankSearchInput: {
    flex: 1,
    ...typography.bodySm,
  },
  bankList: {
    maxHeight: 320,
  },
  bankListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: palette.material.darkThin,
  },
  bankListItemSelected: {
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  bankListIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankListName: {
    flex: 1,
    ...typography.main14,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyListText: {
    ...typography.bodySm,
  },
});

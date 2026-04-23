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
import { networks, walletContacts, Network } from '../../data/mockData';
import { getBanks, validateBankAccount } from '../../api/banks';
import type { BankResponse } from '../../api/banks';
import { isApiError } from '../../api/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';

type Props = NativeStackScreenProps<SendFlowParamList, 'Recipient'>;

type MockContact = {
  name: string;
  initials: string;
  colors: [string, string];
  method: string;
  phone: string;
  flag: string;
  country: string;
};

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const isValidWalletAddress = (addr: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

const truncateAddress = (addr: string): string => {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}\u2026${addr.slice(-6)}`;
};

export const RecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const { amount, sendCurrency, receiveCurrency, receiveAmount } = route.params;
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const isCryptoOut = receiveCurrency === 'USDT';

  const contacts: MockContact[] = useMemo(
    () => [
      {
        name: 'Emeka Johnson',
        initials: 'EJ',
        colors: [palette.royal[600], palette.royal[500]],
        method: 'OPay',
        phone: '0812 456 7890',
        flag: '\u{1F1F3}\u{1F1EC}',
        country: 'Nigeria',
      },
      {
        name: 'Kofi Mensah',
        initials: 'KM',
        colors: [palette.status.partial, palette.royal[500]],
        method: 'MTN Momo',
        phone: '0541 234 567',
        flag: '\u{1F1EC}\u{1F1ED}',
        country: 'Ghana',
      },
      {
        name: 'Adaeze Obi',
        initials: 'AO',
        colors: [palette.royal[400], palette.royal[600]],
        method: 'GTBank',
        phone: '\u00B7\u00B7\u00B7\u00B7 4521',
        flag: '\u{1F1F3}\u{1F1EC}',
        country: 'Nigeria',
      },
    ],
    []
  );

  // Shared state
  const [inputVal, setInputVal] = useState('');

  // Fiat-out state (bank/mobile money)
  const [resolveState, setResolveState] = useState<'idle' | 'resolving' | 'resolved' | 'error'>('idle');
  const [resolvedContact, setResolvedContact] = useState<(typeof contacts)[0] | null>(null);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showBankListSheet, setShowBankListSheet] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Crypto-out state (wallet)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[1]); // Default to Polygon
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletAddressTouched, setWalletAddressTouched] = useState(false);

  // Banks from API
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);

  // Bank validation state
  const [bankValidationState, setBankValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [bankValidationError, setBankValidationError] = useState('');

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

  const bankFormValid = selectedBank && bankAccountNumber.length === 10 && bankValidationState === 'valid' && bankAccountName.trim().length >= 2;

  const walletAddressValid = isValidWalletAddress(walletAddress);
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

  const handleInput = useCallback(
    (val: string) => {
      setInputVal(val);
      if (!isCryptoOut && val.length >= 10) {
        setResolveState('resolving');
        setResolvedContact(null);
        setTimeout(() => {
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
    [isCryptoOut, contacts]
  );

  const handleWalletAddressChange = useCallback((val: string) => {
    setWalletAddress(val);
    setWalletAddressTouched(true);
  }, []);

  const handlePasteAddress = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setWalletAddress(text.trim());
      setWalletAddressTouched(true);
    }
  }, []);

  const selectContact = useCallback(
    (c: (typeof contacts)[0]) => {
      navigation.navigate('Confirm', {
        amount,
        sendCurrency,
        receiveCurrency,
        receiveAmount,
        recipientName: c.name,
        recipientInitials: c.initials,
        recipientColors: c.colors,
        recipientMethod: c.method,
        recipientPhone: c.phone,
        recipientFlag: c.flag,
      });
    },
    [navigation, amount, sendCurrency, receiveCurrency, receiveAmount]
  );

  const selectWalletContact = useCallback(
    (w: (typeof walletContacts)[0]) => {
      navigation.navigate('Confirm', {
        amount,
        sendCurrency,
        receiveCurrency,
        receiveAmount,
        recipientName: w.name,
        recipientInitials: w.initials,
        recipientColors: w.colors,
        recipientMethod: w.network,
        recipientFlag: '\u{1FA99}',
        recipientWalletAddress: w.walletAddress,
        recipientNetwork: w.network,
      });
    },
    [navigation, amount, sendCurrency, receiveCurrency, receiveAmount]
  );

  const handleContinueWithWallet = useCallback(() => {
    if (!walletAddressValid) return;
    const initials = 'WA';
    navigation.navigate('Confirm', {
      amount,
      sendCurrency,
      receiveCurrency,
      receiveAmount,
      recipientName: truncateAddress(walletAddress),
      recipientInitials: initials,
      recipientColors: [palette.royal[500], palette.royal[600]],
      recipientMethod: selectedNetwork.name,
      recipientFlag: '\u{1FA99}',
      recipientWalletAddress: walletAddress,
      recipientNetwork: selectedNetwork.name,
    });
  }, [
    navigation,
    amount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
    walletAddress,
    walletAddressValid,
    selectedNetwork,
    palette.royal[500],
    palette.royal[600],
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
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
            <Text style={[styles.swapValue, { color: palette.grey[300] }]}>
              {sendSymbol}
              {amount.toLocaleString()} {sendCurrency}
            </Text>
          </View>
          <View style={styles.swapArrow}>
            <Ionicons name="arrow-down" size={14} color={palette.grey[500]} />
          </View>
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>They receive</Text>
            <Text style={[styles.swapValue, { color: palette.grey[300] }]}>
              {isCryptoOut
                ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
          </View>
        </View>

        {isCryptoOut ? (
          <>
            {/* Network Selector */}
            <TouchableOpacity
              style={[
                styles.networkSelector,
                { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin },
              ]}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.networkSelectorLeft}>
                <Text style={[styles.networkSelectorLabel, { color: palette.grey[500] }]}>Network</Text>
                <View
                  style={[
                    styles.networkPill,
                    {
                      backgroundColor: palette.grey[800],
                      borderColor: palette.material.lightThin,
                    },
                  ]}
                >
                  <Ionicons name={selectedNetwork.icon as any} size={16} color={palette.grey[300]} />
                  <Text style={[styles.networkPillText, { color: palette.grey[300] }]}>{selectedNetwork.name}</Text>
                  <Ionicons name="chevron-down" size={14} color={palette.grey[500]} />
                </View>
              </View>
              <Text style={[styles.networkGas, { color: palette.grey[500] }]}>{selectedNetwork.gasEstimate} gas</Text>
            </TouchableOpacity>

            {/* Wallet Address Input */}
            <View
              style={[
                styles.walletInputCard,
                { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin },
                walletAddressError && { borderColor: palette.status.negative },
                walletAddressValid && { borderColor: palette.royal[500] },
              ]}
            >
              <View style={styles.walletInputHeader}>
                <Text style={[styles.walletInputLabel, { color: palette.grey[500] }]}>Recipient Wallet Address</Text>
                <TouchableOpacity
                  onPress={handlePasteAddress}
                  style={[styles.pasteBtn, { backgroundColor: palette.grey[900], borderWidth: 1, borderColor: palette.material.lightThin }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={14} color={palette.grey[300]} />
                  <Text style={[styles.pasteBtnText, { color: palette.grey[300] }]}>Paste</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.walletInput,
                  {
                    color: palette.grey[300],
                    backgroundColor: palette.grey[900],
                    borderColor: palette.material.lightThin,
                  },
                ]}
                placeholder="0x..."
                placeholderTextColor={palette.grey[500]}
                value={walletAddress}
                onChangeText={handleWalletAddressChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {walletAddressError && (
                <View style={styles.walletErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={palette.status.negative} />
                  <Text style={[styles.walletErrorText, { color: palette.status.negative }]}>Invalid wallet address format</Text>
                </View>
              )}
              {walletAddressValid && (
                <View style={styles.walletValidRow}>
                  <Ionicons name="checkmark-circle" size={14} color={palette.royal[500]} />
                  <Text style={[styles.walletValidText, { color: palette.royal[500] }]}>
                    Valid {selectedNetwork.name} address
                  </Text>
                </View>
              )}
            </View>

            {/* Continue Button */}
            <View style={styles.walletContinueWrap}>
              <CTAButton
                title="Continue"
                disabled={!walletAddressValid}
                onPress={handleContinueWithWallet}
              />
            </View>

            {/* Saved Wallets */}
            <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Saved Wallets</Text>
            <View style={styles.contactList}>
              {walletContacts.map((w, index) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.contactItem,
                    index === walletContacts.length - 1 && styles.contactItemLast,
                  ]}
                  onPress={() => selectWalletContact(w)}
                  activeOpacity={0.7}
                >
                  <Avatar seed={w.name} size={44} />
                  <View style={styles.ciInfo}>
                    <Text style={[styles.ciName, { color: palette.grey[300] }]}>{w.name}</Text>
                    <View style={styles.walletSubRow}>
                      <Text style={[styles.walletAddrText, { color: palette.grey[500] }]}>{truncateAddress(w.walletAddress)}</Text>
                      <View style={[styles.networkBadge, { backgroundColor: palette.grey[900], borderWidth: 1, borderColor: palette.material.lightThin }]}>
                        <Ionicons name={w.networkIcon as any} size={10} color={palette.grey[300]} />
                        <Text style={[styles.networkBadgeText, { color: palette.grey[300] }]}>{w.network}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Smart input card - Fiat out */}
            <View
              style={[
                styles.sendInputPill,
                { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin },
                resolveState !== 'idle' && { borderColor: palette.royal[500] },
              ]}
            >
              <View style={styles.sicField}>
                <Ionicons name="search" size={18} color={palette.grey[500]} style={styles.sicSearchIcon} />
                <TextInput
                  style={[styles.sicInput, { color: palette.grey[300] }]}
                  placeholder="Name, phone number, or account\u2026"
                  placeholderTextColor={palette.grey[500]}
                  value={inputVal}
                  onChangeText={handleInput}
                />
              </View>

              {resolveState === 'resolving' && (
                <View style={[styles.resolvingRow, { borderTopColor: palette.material.lightThin }]}>
                  <View style={[styles.miniSpin, { borderColor: palette.material.lightThin, borderTopColor: palette.royal[500] }]} />
                  <Text style={[styles.resolvingText, { color: palette.grey[500] }]}>Looking up account\u2026</Text>
                </View>
              )}

              {resolveState === 'error' && (
                <View
                  style={[
                    styles.errorRow,
                    { borderTopColor: `${palette.status.negative}26`, backgroundColor: 'rgba(255,77,91,0.15)' },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color={palette.status.negative} />
                  <View style={styles.errorInfo}>
                    <Text style={[styles.errorTitle, { color: palette.status.negative }]}>Account not found</Text>
                    <Text style={[styles.errorSub, { color: palette.grey[500] }]}>
                      Check the number and try again, or add bank details below
                    </Text>
                  </View>
                </View>
              )}

              {resolveState === 'resolved' && resolvedContact && (
                <TouchableOpacity
                  style={[styles.resolvedRow, { borderTopColor: palette.material.lightThin }]}
                  onPress={() => selectContact(resolvedContact)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resolvedCard}>
                    <Avatar seed={resolvedContact.name} size={36} />
                    <View style={styles.rcInfo}>
                      <Text style={[styles.rcName, { color: palette.grey[300] }]}>{resolvedContact.name}</Text>
                      <Text style={[styles.rcSub, { color: palette.grey[500] }]}>
                        {resolvedContact.method} {'\u00B7'} {resolvedContact.phone} {'\u00B7'}{' '}
                        {resolvedContact.country}
                      </Text>
                      <Text style={[styles.noAcctNote, { color: palette.grey[500] }]}>
                        No Qupay account needed — they'll receive a standard {resolvedContact.method} credit {'\u2713'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.rcCheck, { color: palette.status.positive }]}>{'\u2713'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add bank account for non-Qupay users */}
            <TouchableOpacity
              style={[
                styles.addBankBtn,
                {
                  backgroundColor: palette.grey[800],
                  borderColor: palette.material.lightThin,
                },
              ]}
              onPress={() => setShowBankSheet(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.addBankIcon, { backgroundColor: palette.grey[900], borderWidth: 1, borderColor: palette.material.lightThin }]}>
                <Ionicons name="business-outline" size={18} color={palette.grey[300]} />
              </View>
              <View style={styles.addBankInfo}>
                <Text style={[styles.addBankTitle, { color: palette.grey[300] }]}>Bank Transfer</Text>
                <Text style={[styles.addBankSub, { color: palette.grey[500] }]}>Send directly to a bank account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
            </TouchableOpacity>

            {/* Recent contacts */}
            <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Recent</Text>
            <View style={styles.contactList}>
              {contacts.map((c, index) => (
                <TouchableOpacity
                  key={c.initials}
                  style={[
                    styles.contactItem,
                    index === contacts.length - 1 && styles.contactItemLast,
                  ]}
                  onPress={() => selectContact(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ciAvWrap}>
                    <Avatar seed={c.name} size={44} />
                    <View
                      style={[
                        styles.ciFlag,
                        {
                          backgroundColor: palette.grey[900],
                          borderColor: palette.grey[900],
                        },
                      ]}
                    >
                      <Text style={styles.ciFlagText}>{c.flag}</Text>
                    </View>
                  </View>
                  <View style={styles.ciInfo}>
                    <Text style={[styles.ciName, { color: palette.grey[300] }]}>{c.name}</Text>
                    <Text style={[styles.ciSub, { color: palette.grey[500] }]}>
                      {c.method} {'\u00B7'} {c.phone} {'\u00B7'} {c.country}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={palette.grey[500]} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Network Picker Sheet */}
      <BottomSheet
        visible={showNetworkPicker}
        onClose={() => setShowNetworkPicker(false)}
        title="Select Network"
      >
        {networks.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.networkItem,
              { borderBottomColor: palette.material.lightThin },
              selectedNetwork.id === n.id && { backgroundColor: 'rgba(251,251,253,0.06)' },
            ]}
            onPress={() => {
              setSelectedNetwork(n);
              setShowNetworkPicker(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.networkItemIcon, { backgroundColor: palette.material.lightThin }]}>
              <Ionicons
                name={n.icon as any}
                size={20}
                color={selectedNetwork.id === n.id ? palette.royal[500] : palette.grey[300]}
              />
            </View>
            <View style={styles.networkItemInfo}>
              <Text
                style={[
                  styles.networkItemName,
                  { color: selectedNetwork.id === n.id ? palette.royal[500] : palette.grey[300] },
                ]}
              >
                {n.name}
              </Text>
              <Text style={[styles.networkItemGas, { color: palette.grey[500] }]}>Gas {n.gasEstimate}</Text>
            </View>
            {selectedNetwork.id === n.id && <Ionicons name="checkmark" size={18} color={palette.royal[500]} />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

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
              { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin },
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
                { color: selectedBank ? palette.grey[300] : palette.grey[500] },
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
                  backgroundColor: palette.grey[800],
                  borderColor: bankValidationState === 'valid' 
                    ? palette.royal[500] 
                    : bankValidationState === 'invalid' 
                      ? palette.status.negative 
                      : palette.material.lightThin,
                  color: palette.grey[300],
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
                backgroundColor: palette.grey[800],
                borderColor: bankValidationState === 'valid' ? palette.royal[500] : palette.material.lightThin,
              },
            ]}
          >
            {bankValidationState === 'validating' ? (
              <Text style={[styles.accountNamePlaceholder, { color: palette.grey[500] }]}>
                Verifying account...
              </Text>
            ) : bankAccountName ? (
              <Text style={[styles.accountNameText, { color: palette.grey[300] }]}>
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
                recipientName: bankAccountName.trim(),
                recipientInitials: initials,
                recipientColors: [palette.royal[600], palette.royal[500]],
                recipientMethod: bankName,
                recipientPhone: bankAccountNumber,
                recipientFlag: '\u{1F1F3}\u{1F1EC}',
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
              { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin },
            ]}
          >
            <Ionicons name="search" size={18} color={palette.grey[500]} />
            <TextInput
              style={[styles.bankSearchInput, { color: palette.grey[300] }]}
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
                    { borderBottomColor: palette.material.lightThin },
                    selectedBank === item.bankCode && [styles.bankListItemSelected, { backgroundColor: 'rgba(251,251,253,0.06)' }],
                  ]}
                  onPress={() => selectBank(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bankListIcon, { backgroundColor: palette.material.lightThin }]}>
                    <Ionicons
                      name="business"
                      size={16}
                      color={selectedBank === item.bankCode ? palette.royal[500] : palette.grey[500]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.bankListName,
                      { color: selectedBank === item.bankCode ? palette.royal[500] : palette.grey[300] },
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
    borderBottomColor: palette.material.lightThin,
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
    borderBottomColor: palette.material.lightThin,
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
    borderTopColor: palette.material.lightThin,
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
    borderTopColor: palette.material.lightThin,
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
    borderTopColor: palette.material.lightThin,
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
    borderBottomColor: palette.material.lightThin,
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
    borderColor: palette.material.lightThin,
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
    borderBottomColor: palette.material.lightThin,
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

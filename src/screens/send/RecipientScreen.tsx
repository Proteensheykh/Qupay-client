import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Avatar, CTAButton, BottomSheet } from '../../components';
import { banks, Bank, networks, walletContacts, Network } from '../../data/mockData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

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
  const { theme } = useTheme();
  const { amount, sendCurrency, receiveCurrency, receiveAmount } = route.params;
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const isCryptoOut = receiveCurrency === 'USDT';

  const contacts: MockContact[] = useMemo(
    () => [
      {
        name: 'Emeka Johnson',
        initials: 'EJ',
        colors: [theme.secondary.dark, theme.secondary.main],
        method: 'OPay',
        phone: '0812 456 7890',
        flag: '\u{1F1F3}\u{1F1EC}',
        country: 'Nigeria',
      },
      {
        name: 'Kofi Mensah',
        initials: 'KM',
        colors: [theme.warning.main, theme.secondary.main],
        method: 'MTN Momo',
        phone: '0541 234 567',
        flag: '\u{1F1EC}\u{1F1ED}',
        country: 'Ghana',
      },
      {
        name: 'Adaeze Obi',
        initials: 'AO',
        colors: [theme.info.light, theme.secondary.dark],
        method: 'GTBank',
        phone: '\u00B7\u00B7\u00B7\u00B7 4521',
        flag: '\u{1F1F3}\u{1F1EC}',
        country: 'Nigeria',
      },
    ],
    [theme]
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

  const countryBanks = banks['Nigeria'] || [];
  const popularBanks = useMemo(() => countryBanks.filter((b) => b.popular), [countryBanks]);
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return countryBanks;
    const search = bankSearch.toLowerCase();
    return countryBanks.filter((b) => b.name.toLowerCase().includes(search));
  }, [countryBanks, bankSearch]);
  const bankFormValid = selectedBank && bankAccountNumber.length >= 8 && bankAccountName.trim().length >= 2;

  const walletAddressValid = isValidWalletAddress(walletAddress);
  const walletAddressError = walletAddressTouched && walletAddress.length > 0 && !walletAddressValid;

  const selectBank = useCallback((bank: Bank) => {
    setSelectedBank(bank.id);
    setBankName(bank.name);
    setShowBankListSheet(false);
    setBankSearch('');
  }, []);

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
      recipientColors: [theme.secondary.main, theme.secondary.dark],
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
    theme.secondary.main,
    theme.secondary.dark,
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScreenHeader title="Who are you sending to?" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Swap summary card */}
        <View
          style={[
            styles.swapSummary,
            {
              backgroundColor: theme.info.bg,
              borderColor: `${theme.secondary.main}26`,
            },
          ]}
        >
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>Sending</Text>
            <Text style={[styles.swapValue, { color: theme.text.primary }]}>
              {sendSymbol}
              {amount.toLocaleString()} {sendCurrency}
            </Text>
          </View>
          <View style={styles.swapArrow}>
            <Ionicons name="arrow-down" size={14} color={theme.secondary.main} />
          </View>
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>They receive</Text>
            <Text style={[styles.swapValue, { color: theme.secondary.main }]}>
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
                { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
              ]}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.networkSelectorLeft}>
                <Text style={[styles.networkSelectorLabel, { color: theme.text.secondary }]}>Network</Text>
                <View
                  style={[
                    styles.networkPill,
                    {
                      backgroundColor: theme.info.bg,
                      borderColor: `${theme.secondary.main}40`,
                    },
                  ]}
                >
                  <Ionicons name={selectedNetwork.icon as any} size={16} color={theme.secondary.main} />
                  <Text style={[styles.networkPillText, { color: theme.text.primary }]}>{selectedNetwork.name}</Text>
                  <Ionicons name="chevron-down" size={14} color={theme.text.secondary} />
                </View>
              </View>
              <Text style={[styles.networkGas, { color: theme.text.muted }]}>{selectedNetwork.gasEstimate} gas</Text>
            </TouchableOpacity>

            {/* Wallet Address Input */}
            <View
              style={[
                styles.walletInputCard,
                { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
                walletAddressError && { borderColor: theme.error.main },
                walletAddressValid && { borderColor: theme.secondary.main },
              ]}
            >
              <View style={styles.walletInputHeader}>
                <Text style={[styles.walletInputLabel, { color: theme.text.secondary }]}>Recipient Wallet Address</Text>
                <TouchableOpacity
                  onPress={handlePasteAddress}
                  style={[styles.pasteBtn, { backgroundColor: theme.info.bg }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={14} color={theme.secondary.main} />
                  <Text style={[styles.pasteBtnText, { color: theme.secondary.main }]}>Paste</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.walletInput,
                  {
                    color: theme.text.primary,
                    backgroundColor: theme.background.paper,
                    borderColor: theme.inputBorder,
                  },
                ]}
                placeholder="0x..."
                placeholderTextColor={theme.text.muted}
                value={walletAddress}
                onChangeText={handleWalletAddressChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {walletAddressError && (
                <View style={styles.walletErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={theme.error.main} />
                  <Text style={[styles.walletErrorText, { color: theme.error.main }]}>Invalid wallet address format</Text>
                </View>
              )}
              {walletAddressValid && (
                <View style={styles.walletValidRow}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.secondary.main} />
                  <Text style={[styles.walletValidText, { color: theme.secondary.main }]}>
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
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Saved Wallets</Text>
            <View style={styles.contactList}>
              {walletContacts.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.contactItem, { borderBottomColor: theme.inputBorder }]}
                  onPress={() => selectWalletContact(w)}
                  activeOpacity={0.7}
                >
                  <Avatar seed={w.name} size={44} />
                  <View style={styles.ciInfo}>
                    <Text style={[styles.ciName, { color: theme.text.primary }]}>{w.name}</Text>
                    <View style={styles.walletSubRow}>
                      <Text style={[styles.walletAddrText, { color: theme.text.secondary }]}>{truncateAddress(w.walletAddress)}</Text>
                      <View style={[styles.networkBadge, { backgroundColor: theme.info.bg }]}>
                        <Ionicons name={w.networkIcon as any} size={10} color={theme.secondary.main} />
                        <Text style={[styles.networkBadgeText, { color: theme.secondary.main }]}>{w.network}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Smart input card - Fiat out */}
            <View
              style={[
                styles.sendInputCard,
                { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
                resolveState !== 'idle' && { borderColor: theme.secondary.main },
              ]}
            >
              <View style={styles.sicField}>
                <Text style={[styles.sicLabel, { color: theme.text.secondary }]}>To</Text>
                <TextInput
                  style={[styles.sicInput, { color: theme.text.primary }]}
                  placeholder="Name, phone number, or account\u2026"
                  placeholderTextColor={theme.text.muted}
                  value={inputVal}
                  onChangeText={handleInput}
                />
              </View>

              {resolveState === 'resolving' && (
                <View style={[styles.resolvingRow, { borderTopColor: theme.inputBorder }]}>
                  <View style={[styles.miniSpin, { borderColor: theme.info.bg, borderTopColor: theme.secondary.main }]} />
                  <Text style={[styles.resolvingText, { color: theme.text.secondary }]}>Looking up account\u2026</Text>
                </View>
              )}

              {resolveState === 'error' && (
                <View
                  style={[
                    styles.errorRow,
                    { borderTopColor: `${theme.error.main}26`, backgroundColor: theme.error.bg },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color={theme.error.main} />
                  <View style={styles.errorInfo}>
                    <Text style={[styles.errorTitle, { color: theme.error.main }]}>Account not found</Text>
                    <Text style={[styles.errorSub, { color: theme.text.secondary }]}>
                      Check the number and try again, or add bank details below
                    </Text>
                  </View>
                </View>
              )}

              {resolveState === 'resolved' && resolvedContact && (
                <TouchableOpacity
                  style={[styles.resolvedRow, { borderTopColor: theme.inputBorder }]}
                  onPress={() => selectContact(resolvedContact)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resolvedCard}>
                    <Avatar seed={resolvedContact.name} size={36} />
                    <View style={styles.rcInfo}>
                      <Text style={[styles.rcName, { color: theme.text.primary }]}>{resolvedContact.name}</Text>
                      <Text style={[styles.rcSub, { color: theme.text.secondary }]}>
                        {resolvedContact.method} {'\u00B7'} {resolvedContact.phone} {'\u00B7'}{' '}
                        {resolvedContact.country}
                      </Text>
                      <Text style={[styles.noAcctNote, { color: theme.secondary.main }]}>
                        No Qupay account needed — they'll receive a standard {resolvedContact.method} credit {'\u2713'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.rcCheck, { color: theme.secondary.main }]}>{'\u2713'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add bank account for non-Qupay users */}
            <TouchableOpacity
              style={[
                styles.addBankBtn,
                {
                  backgroundColor: theme.info.bg,
                  borderColor: `${theme.secondary.main}26`,
                },
              ]}
              onPress={() => setShowBankSheet(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.addBankIcon, { backgroundColor: theme.info.bg }]}>
                <Ionicons name="business-outline" size={18} color={theme.secondary.main} />
              </View>
              <View style={styles.addBankInfo}>
                <Text style={[styles.addBankTitle, { color: theme.secondary.main }]}>Bank Transfer</Text>
                <Text style={[styles.addBankSub, { color: theme.text.secondary }]}>Send directly to a bank account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
            </TouchableOpacity>

            {/* Recent contacts */}
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Recent</Text>
            <View style={styles.contactList}>
              {contacts.map((c) => (
                <TouchableOpacity
                  key={c.initials}
                  style={[styles.contactItem, { borderBottomColor: theme.inputBorder }]}
                  onPress={() => selectContact(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ciAvWrap}>
                    <Avatar seed={c.name} size={44} />
                    <View
                      style={[
                        styles.ciFlag,
                        {
                          backgroundColor: theme.background.default,
                          borderColor: theme.background.default,
                        },
                      ]}
                    >
                      <Text style={styles.ciFlagText}>{c.flag}</Text>
                    </View>
                  </View>
                  <View style={styles.ciInfo}>
                    <Text style={[styles.ciName, { color: theme.text.primary }]}>{c.name}</Text>
                    <Text style={[styles.ciSub, { color: theme.text.secondary }]}>
                      {c.method} {'\u00B7'} {c.phone} {'\u00B7'} {c.country}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
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
              { borderBottomColor: theme.divider },
              selectedNetwork.id === n.id && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => {
              setSelectedNetwork(n);
              setShowNetworkPicker(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.networkItemIcon, { backgroundColor: theme.divider }]}>
              <Ionicons
                name={n.icon as any}
                size={20}
                color={selectedNetwork.id === n.id ? theme.secondary.main : theme.text.primary}
              />
            </View>
            <View style={styles.networkItemInfo}>
              <Text
                style={[
                  styles.networkItemName,
                  { color: selectedNetwork.id === n.id ? theme.secondary.main : theme.text.primary },
                ]}
              >
                {n.name}
              </Text>
              <Text style={[styles.networkItemGas, { color: theme.text.secondary }]}>Gas {n.gasEstimate}</Text>
            </View>
            {selectedNetwork.id === n.id && <Ionicons name="checkmark" size={18} color={theme.secondary.main} />}
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
          <Text style={[styles.bankLabel, { color: theme.text.secondary }]}>Select Bank</Text>
          <TouchableOpacity
            style={[
              styles.bankDropdown,
              { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
              selectedBank && { borderColor: theme.secondary.main },
            ]}
            onPress={() => setShowBankListSheet(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={selectedBank ? theme.secondary.main : theme.text.muted}
            />
            <Text
              style={[
                styles.bankDropdownText,
                { color: selectedBank ? theme.text.primary : theme.text.muted },
              ]}
            >
              {bankName || 'Choose a bank...'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.text.muted} />
          </TouchableOpacity>

          {popularBanks.length > 0 && (
            <>
              <Text style={[styles.bankSubLabel, { color: theme.text.muted }]}>Quick Select</Text>
              <View style={styles.bankPicker}>
                {popularBanks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bankChip,
                      { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
                      selectedBank === b.id && {
                        borderColor: theme.secondary.main,
                        backgroundColor: theme.info.bg,
                      },
                    ]}
                    onPress={() => selectBank(b)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bankChipText,
                        { color: selectedBank === b.id ? theme.secondary.main : theme.text.secondary },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.bankLabel, { color: theme.text.secondary }]}>Account Number</Text>
          <TextInput
            style={[
              styles.bankInput,
              {
                backgroundColor: theme.background.surface,
                borderColor: theme.inputBorder,
                color: theme.text.primary,
              },
            ]}
            placeholder="Enter account number"
            placeholderTextColor={theme.text.muted}
            keyboardType="number-pad"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            maxLength={20}
          />

          <Text style={[styles.bankLabel, { color: theme.text.secondary }]}>Account Holder Name</Text>
          <TextInput
            style={[
              styles.bankInput,
              {
                backgroundColor: theme.background.surface,
                borderColor: theme.inputBorder,
                color: theme.text.primary,
              },
            ]}
            placeholder="Enter account holder name"
            placeholderTextColor={theme.text.muted}
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
              navigation.navigate('Confirm', {
                amount,
                sendCurrency,
                receiveCurrency,
                receiveAmount,
                recipientName: bankAccountName.trim(),
                recipientInitials: initials,
                recipientColors: [theme.secondary.dark, theme.secondary.main],
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
              { backgroundColor: theme.background.surface, borderColor: theme.inputBorder },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.text.muted} />
            <TextInput
              style={[styles.bankSearchInput, { color: theme.text.primary }]}
              placeholder="Search banks..."
              placeholderTextColor={theme.text.muted}
              value={bankSearch}
              onChangeText={setBankSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {bankSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBankSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={theme.text.muted} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.id}
            style={styles.bankList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.bankListItem,
                  { borderBottomColor: theme.divider },
                  selectedBank === item.id && [styles.bankListItemSelected, { backgroundColor: theme.info.bg }],
                ]}
                onPress={() => selectBank(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.bankListIcon, { backgroundColor: theme.divider }]}>
                  <Ionicons
                    name="business"
                    size={16}
                    color={selectedBank === item.id ? theme.secondary.main : theme.text.secondary}
                  />
                </View>
                <Text
                  style={[
                    styles.bankListName,
                    { color: selectedBank === item.id ? theme.secondary.main : theme.text.primary },
                  ]}
                >
                  {item.name}
                </Text>
                {selectedBank === item.id && <Ionicons name="checkmark" size={18} color={theme.secondary.main} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Ionicons name="search-outline" size={32} color={theme.text.muted} />
                <Text style={[styles.emptyListText, { color: theme.text.muted }]}>No banks found</Text>
              </View>
            }
          />
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
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  swapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swapArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  swapLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  swapValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  networkSelector: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  networkSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkSelectorLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  networkPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  networkGas: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  walletInputCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  walletInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletInputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pasteBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  walletInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 10,
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
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  walletValidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  walletValidText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  networkBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  networkItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkItemInfo: {
    flex: 1,
  },
  networkItemName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  networkItemGas: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  sendInputCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
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
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: 30,
  },
  sicInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  miniSpin: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 7,
  },
  resolvingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
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
  },
  rcSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  noAcctNote: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    marginTop: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  errorInfo: { flex: 1 },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  errorSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  rcCheck: {
    fontSize: 18,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  },
  ciAvWrap: { position: 'relative' },
  ciFlag: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ciFlagText: { fontSize: 12 },
  ciInfo: { flex: 1 },
  ciName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  ciSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
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
    borderRadius: 12,
  },
  addBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBankInfo: { flex: 1 },
  addBankTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  addBankSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  bankForm: {
    paddingHorizontal: 24,
  },
  bankLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bankSubLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bankDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bankDropdownText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  bankPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bankChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  bankChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  bankInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 16,
  },
  bankListContainer: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  bankSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  bankSearchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
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
  },
  bankListItemSelected: {
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bankListIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankListName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyListText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});

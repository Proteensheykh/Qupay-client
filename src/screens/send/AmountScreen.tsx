import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, GradientAvatar, CTAButton, BottomSheet, Numpad } from '../../components';
import { coinLogos, networkLogos } from '../../data/cryptoIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'Amount'>;

// ─── Stablecoins only ───
const stablecoins = [
  { code: 'USDT', name: 'Tether', icon: '\u{1FA99}', color: '#26A17B' },
  { code: 'USDC', name: 'USD Coin', icon: '\u{1F535}', color: '#2775CA' },
  { code: 'DAI',  name: 'Dai',      icon: '\u{1F7E1}', color: '#F5AC37' },
  { code: 'BUSD', name: 'Binance USD', icon: '\u{1F7E1}', color: '#F0B90B' },
  { code: 'TUSD', name: 'TrueUSD',  icon: '\u{1F535}', color: '#1A5AFF' },
  { code: 'FRAX', name: 'Frax',     icon: '\u26AB',     color: '#000000' },
];

const receiveCurrencies = [
  { code: 'NGN', name: 'Nigerian Naira',       icon: '\u{1F1F3}\u{1F1EC}', color: '#008751', symbol: '\u20A6' },
  { code: 'GHS', name: 'Ghanaian Cedi',        icon: '\u{1F1EC}\u{1F1ED}', color: '#CE1126', symbol: '\u20B5' },
  { code: 'KES', name: 'Kenyan Shilling',      icon: '\u{1F1F0}\u{1F1EA}', color: '#006600', symbol: 'KSh' },
  { code: 'INR', name: 'Indian Rupee',         icon: '\u{1F1EE}\u{1F1F3}', color: '#FF9933', symbol: '\u20B9' },
  { code: 'PHP', name: 'Philippine Peso',      icon: '\u{1F1F5}\u{1F1ED}', color: '#0038A8', symbol: '\u20B1' },
  { code: 'MXN', name: 'Mexican Peso',         icon: '\u{1F1F2}\u{1F1FD}', color: '#006847', symbol: '$' },
  { code: 'PKR', name: 'Pakistani Rupee',      icon: '\u{1F1F5}\u{1F1F0}', color: '#01411C', symbol: 'Rs' },
  { code: 'ZAR', name: 'South African Rand',   icon: '\u{1F1FF}\u{1F1E6}', color: '#007749', symbol: 'R' },
];

const rateMap: Record<string, Record<string, number>> = {
  USDT: { NGN: 1645, GHS: 15.16, KES: 128.7, INR: 83.5, PHP: 56.78, MXN: 17.24, PKR: 278.5, ZAR: 18.9 },
  USDC: { NGN: 1644, GHS: 15.15, KES: 128.6, INR: 83.4, PHP: 56.7,  MXN: 17.22, PKR: 278.3, ZAR: 18.88 },
  DAI:  { NGN: 1643, GHS: 15.14, KES: 128.5, INR: 83.3, PHP: 56.6,  MXN: 17.2,  PKR: 278.0, ZAR: 18.85 },
  BUSD: { NGN: 1644, GHS: 15.15, KES: 128.6, INR: 83.4, PHP: 56.7,  MXN: 17.22, PKR: 278.3, ZAR: 18.88 },
  TUSD: { NGN: 1643, GHS: 15.14, KES: 128.5, INR: 83.3, PHP: 56.6,  MXN: 17.2,  PKR: 278.0, ZAR: 18.85 },
  FRAX: { NGN: 1642, GHS: 15.13, KES: 128.4, INR: 83.2, PHP: 56.5,  MXN: 17.18, PKR: 277.8, ZAR: 18.83 },
};

const networks = [
  { id: 'polygon',  name: 'Polygon',   icon: '\u{1F7E3}', gas: '~$0.01',  address: '0x4c2A9f8E3d7B6a1C0e5F2d8A9b4C7e6F3a1D5b' },
  { id: 'ethereum', name: 'Ethereum',  icon: '\u{1F4A0}', gas: '~$2.50',  address: '0x7a3B8c9D1e2F3a4B5c6D7e8F9a0B1c2D3e4F2e' },
  { id: 'base',     name: 'Base',      icon: '\u{1F535}', gas: '~$0.05',  address: '0x1e8B4f7A2c9D3e6F5a0B8c1D4e7F9a2B5c3D6e' },
  { id: 'arbitrum', name: 'Arbitrum',  icon: '\u{1F4A0}', gas: '~$0.15',  address: '0x9d5F2e8A1b3C7d6E0f4A8B9c2D5e7F1a3B6c4d' },
  { id: 'bsc',      name: 'BNB Chain', icon: '\u{1F7E1}', gas: '~$0.10',  address: '0x2f9A3e8B1c4D7a6E5f0B8c1D9e3F2a4B6c5D7e' },
];

export const AmountScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientInitials = 'EJ',
    recipientColors = ['#1a6fff', '#00e5a0'] as [string, string],
    recipientMethod = 'OPay',
    recipientFlag = '\u{1F1F3}\u{1F1EC}',
    dest,
  } = route.params || {};

  // Currency state
  const [selectedCoin, setSelectedCoin] = useState(stablecoins[0]);
  const [selectedFiat, setSelectedFiat] = useState(
    receiveCurrencies.find((c) => c.code === (dest?.code || 'NGN')) || receiveCurrencies[0]
  );
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [showFiatPicker, setShowFiatPicker] = useState(false);

  // Amount
  const [amount, setAmount] = useState('');
  const rate = rateMap[selectedCoin.code]?.[selectedFiat.code] || 1645;
  const numAmount = parseFloat(amount) || 0;
  const fiatEquivalent = Math.round(numAmount * rate);
  const fee = Math.round(numAmount * rate * 0.01);
  const feePct = numAmount > 0 ? ((fee / (numAmount * rate)) * 100).toFixed(2) : '0';

  // Network & wallet
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  // QR sheet
  const [showQR, setShowQR] = useState(false);

  // PIN sheet
  const [showPinSheet, setShowPinSheet] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const shortAddr = `${selectedNetwork.address.slice(0, 8)}\u2026${selectedNetwork.address.slice(-6)}`;

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(selectedNetwork.address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [selectedNetwork.address]);

  const handlePinKey = useCallback(
    (key: string) => {
      setPinError('');
      if (key === 'del') {
        setPin((p) => p.slice(0, -1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (key === '' || pin.length >= 4) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const next = pin + key;
      setPin(next);

      if (next.length === 4) {
        // In a real app we'd validate the PIN — for demo, accept any 4 digits
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setShowPinSheet(false);
          setPin('');
          navigation.navigate('DepositWaiting', {
            recipientName,
            recipientMethod,
            recipientFlag,
            amount: numAmount,
            receiveAmount: fiatEquivalent,
            sendCurrency: selectedCoin.code,
            recvCurrency: selectedFiat.code,
            walletAddress: selectedNetwork.address,
            network: selectedNetwork.name,
            dest,
          });
        }, 400);
      }
    },
    [pin, navigation, recipientName, recipientMethod, recipientFlag, numAmount, fiatEquivalent, selectedCoin.code, selectedFiat.code, selectedNetwork, dest]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Send" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient strip */}
        <View style={styles.recipStrip}>
          <GradientAvatar initials={recipientInitials} size={34} colors={recipientColors} fontSize={11} />
          <View style={styles.rsInfo}>
            <Text style={styles.rsName}>{recipientName}</Text>
            <Text style={styles.rsSub}>{recipientMethod} {'\u00B7'} No Qupay account needed</Text>
          </View>
          <View style={styles.vtag}>
            <Ionicons name="checkmark" size={10} color="#00E5A0" />
            <Text style={styles.vtagText}>Verified</Text>
          </View>
        </View>

        {/* ─── Amount Card ─── */}
        <View style={styles.amountCard}>
          {/* Send row */}
          <View style={styles.acSection}>
            <Text style={styles.acLabel}>You send</Text>
            <View style={styles.acRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,245,0.25)"
              />
              <TouchableOpacity style={styles.sendCurrPill} onPress={() => setShowCoinPicker(true)} activeOpacity={0.7}>
                <Image source={{ uri: coinLogos[selectedCoin.code] }} style={styles.coinLogo} />
                <Text style={styles.currText}>{selectedCoin.code}</Text>
                <View style={styles.chevronWrap}>
                  <Ionicons name="swap-vertical" size={14} color="#00E5A0" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rate divider */}
          <View style={styles.rateDivider}>
            <View style={styles.rateLine} />
            <View style={styles.ratePill}>
              <Text style={styles.ratePillText}>
                1 {selectedCoin.code} = {selectedFiat.symbol}{rate.toLocaleString()}
              </Text>
            </View>
            <View style={styles.rateLine} />
          </View>

          {/* Receive row */}
          <View style={styles.acSectionRecv}>
            <Text style={styles.acLabel}>They receive</Text>
            <View style={styles.acRow}>
              <Text style={styles.recvAmount}>
                {numAmount > 0 ? `${selectedFiat.symbol}${fiatEquivalent.toLocaleString()}` : '\u2014'}
              </Text>
              <TouchableOpacity style={styles.recvCurrPill} onPress={() => setShowFiatPicker(true)} activeOpacity={0.7}>
                <Text style={styles.currFlagIcon}>{selectedFiat.icon}</Text>
                <Text style={styles.currText}>{selectedFiat.code}</Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,245,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fee + delivery */}
        {numAmount > 0 && (
          <View style={styles.metaRows}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Fee included</Text>
              <Text style={styles.feeValue}>
                {selectedFiat.symbol}{fee.toLocaleString()} <Text style={styles.feePct}>{feePct}%</Text>
              </Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Delivery</Text>
              <View style={styles.deliveryPill}>
                <Ionicons name="flash" size={11} color="#00E5A0" />
                <Text style={styles.deliveryText}>~2 min via {recipientMethod}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Deposit Address Card ─── */}
        {numAmount > 0 && (
          <View style={styles.depositCard}>
            <View style={styles.dcHeader}>
              <View style={styles.dcHeaderLeft}>
                <View style={styles.dcIcon}>
                  <Ionicons name="wallet-outline" size={18} color="#00E5A0" />
                </View>
                <View>
                  <Text style={styles.dcTitle}>Deposit Address</Text>
                  <Text style={styles.dcSubtitle}>
                    Send exactly {numAmount} {selectedCoin.code} to this address
                  </Text>
                </View>
              </View>
            </View>

            {/* Network selector */}
            <TouchableOpacity
              style={styles.networkRow}
              onPress={() => setShowNetworkPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.networkLabel}>Network</Text>
              <View style={styles.networkPill}>
                <Text style={styles.networkIcon}>{selectedNetwork.icon}</Text>
                <Text style={styles.networkName}>{selectedNetwork.name}</Text>
                <Text style={styles.networkGas}>{selectedNetwork.gas} gas</Text>
                <Ionicons name="chevron-down" size={12} color="rgba(255,255,245,0.5)" />
              </View>
            </TouchableOpacity>

            {/* Address display */}
            <TouchableOpacity
              style={styles.addressBox}
              onPress={() => setShowQR(true)}
              activeOpacity={0.7}
            >
              <View style={styles.addrLeft}>
                <Text style={styles.addrMono}>{shortAddr}</Text>
                <Text style={styles.addrHint}>Tap to show QR code</Text>
              </View>
              <View style={styles.qrMini}>
                <Ionicons name="qr-code-outline" size={28} color="#00E5A0" />
              </View>
            </TouchableOpacity>

            {/* Copy button */}
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={copied ? '#00E5A0' : '#FFFFF5'}
              />
              <Text style={[styles.copyText, copied && styles.copyTextGreen]}>
                {copied ? 'Copied!' : 'Copy address'}
              </Text>
            </TouchableOpacity>

            {/* Warning */}
            <View style={styles.warnRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#FFD460" />
              <Text style={styles.warnText}>
                Only send {selectedCoin.code} on {selectedNetwork.name}. Sending other tokens or using a different network may result in loss of funds.
              </Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <CTAButton
            title="I've sent the funds"
            onPress={() => {
              setShowPinSheet(true);
              setPin('');
              setPinError('');
            }}
            disabled={numAmount <= 0}
          />
          {numAmount > 0 && (
            <Text style={styles.ctaNote}>
              You'll need your transaction PIN to confirm
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ─── Stablecoin Picker ─── */}
      <BottomSheet visible={showCoinPicker} onClose={() => setShowCoinPicker(false)} title="Select Stablecoin">
        {stablecoins.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.cpItem, selectedCoin.code === c.code && styles.cpItemSel]}
            onPress={() => { setSelectedCoin(c); setShowCoinPicker(false); }}
            activeOpacity={0.7}
          >
            <Image source={{ uri: coinLogos[c.code] }} style={styles.cpLogo} />
            <View style={styles.cpInfo}>
              <Text style={styles.cpName}>{c.code}</Text>
              <Text style={styles.cpSub}>{c.name}</Text>
            </View>
            {selectedCoin.code === c.code && <Ionicons name="checkmark" size={18} color="#00E5A0" />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* ─── Fiat Currency Picker ─── */}
      <BottomSheet visible={showFiatPicker} onClose={() => setShowFiatPicker(false)} title="Receive Currency">
        {receiveCurrencies.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.cpItem, selectedFiat.code === c.code && styles.cpItemSel]}
            onPress={() => { setSelectedFiat(c); setShowFiatPicker(false); }}
            activeOpacity={0.7}
          >
            <View style={[styles.cpIconWrap, { backgroundColor: c.color + '20' }]}>
              <Text style={styles.cpIcon}>{c.icon}</Text>
            </View>
            <View style={styles.cpInfo}>
              <Text style={styles.cpName}>{c.code}</Text>
              <Text style={styles.cpSub}>{c.name}</Text>
            </View>
            {selectedFiat.code === c.code && <Ionicons name="checkmark" size={18} color="#00E5A0" />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* ─── Network Picker ─── */}
      <BottomSheet visible={showNetworkPicker} onClose={() => setShowNetworkPicker(false)} title="Select Network">
        {networks.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.cpItem, selectedNetwork.id === n.id && styles.cpItemSel]}
            onPress={() => { setSelectedNetwork(n); setShowNetworkPicker(false); setCopied(false); }}
            activeOpacity={0.7}
          >
            <Image source={{ uri: networkLogos[n.id] }} style={styles.cpLogo} />
            <View style={styles.cpInfo}>
              <Text style={styles.cpName}>{n.name}</Text>
              <Text style={styles.cpSub}>Gas {n.gas}</Text>
            </View>
            {selectedNetwork.id === n.id && <Ionicons name="checkmark" size={18} color="#00E5A0" />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* ─── QR Code Sheet ─── */}
      <BottomSheet visible={showQR} onClose={() => setShowQR(false)} title="Scan to Deposit">
        <View style={styles.qrSheet}>
          <View style={styles.qrBox}>
            {/* Simulated QR — grid pattern */}
            <View style={styles.qrGrid}>
              {Array.from({ length: 169 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    // Deterministic pattern from address hash
                    (i * 7 + i * i * 3) % 3 !== 0 && styles.qrCellFilled,
                    // Corner markers
                    ((i % 13 < 3 && Math.floor(i / 13) < 3) ||
                     (i % 13 > 9 && Math.floor(i / 13) < 3) ||
                     (i % 13 < 3 && Math.floor(i / 13) > 9)) && styles.qrCellFilled,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.qrInfo}>
            <Text style={styles.qrNetwork}>{selectedNetwork.icon} {selectedNetwork.name}</Text>
            <Text style={styles.qrAddr} selectable>{selectedNetwork.address}</Text>
          </View>
          <TouchableOpacity style={styles.qrCopyBtn} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color="#111118" />
            <Text style={styles.qrCopyText}>{copied ? 'Copied!' : 'Copy address'}</Text>
          </TouchableOpacity>
          <Text style={styles.qrWarn}>
            Send exactly {numAmount} {selectedCoin.code} on {selectedNetwork.name}
          </Text>
        </View>
        <View style={{ height: 30 }} />
      </BottomSheet>

      {/* ─── PIN Entry Sheet ─── */}
      <BottomSheet visible={showPinSheet} onClose={() => { setShowPinSheet(false); setPin(''); }}>
        <View style={styles.pinSheet}>
          <View style={styles.pinLockIcon}>
            <Ionicons name="lock-closed" size={22} color="#00E5A0" />
          </View>
          <Text style={styles.pinTitle}>Enter Transaction PIN</Text>
          <Text style={styles.pinSubtitle}>
            Confirm sending {numAmount} {selectedCoin.code} to {recipientName.split(' ')[0]}
          </Text>

          {/* PIN dots */}
          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  pin.length > i && styles.pinDotFilled,
                  pinError && pin.length > i && styles.pinDotError,
                ]}
              />
            ))}
          </View>

          {pinError ? (
            <Text style={styles.pinErrorText}>{pinError}</Text>
          ) : null}

          <Numpad onKey={handlePinKey} size="compact" />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  // Recipient strip
  recipStrip: {
    marginHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 12,
  },
  rsInfo: { flex: 1 },
  rsName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5' },
  rsSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.6)' },
  vtag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,160,0.12)', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
  },
  vtagText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#00E5A0' },
  // Amount card
  amountCard: {
    marginHorizontal: 24, marginBottom: 12, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 20, overflow: 'hidden',
  },
  acSection: { paddingVertical: 20, paddingHorizontal: 20 },
  acSectionRecv: { paddingVertical: 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#2A2A42' },
  acLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1,
    textTransform: 'uppercase', color: 'rgba(255,255,245,0.6)', marginBottom: 8,
  },
  acRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 36, color: '#FFFFF5', minWidth: 60, maxWidth: '55%' },
  recvAmount: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 32, color: '#00E5A0' },
  sendCurrPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2A2A42', borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 24, paddingVertical: 10, paddingHorizontal: 14,
    minWidth: 120,
  },
  recvCurrPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#333350', borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.25)',
    borderRadius: 24, paddingVertical: 8, paddingHorizontal: 12,
  },
  chevronWrap: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,229,160,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  coinDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coinDotIcon: { fontSize: 14 },
  currFlagIcon: { fontSize: 16 },
  currText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFF5' },
  rateDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  rateLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,245,0.08)' },
  ratePill: {
    backgroundColor: '#111118', borderWidth: 1, borderColor: 'rgba(0,229,160,0.25)',
    borderRadius: 24, paddingVertical: 5, paddingHorizontal: 12,
  },
  ratePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#00E5A0', fontVariant: ['tabular-nums'] },
  // Fee
  metaRows: {
    marginHorizontal: 24, marginBottom: 16, gap: 8,
  },
  feeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  deliveryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  deliveryText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#00E5A0',
  },
  feeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,245,0.6)' },
  feeValue: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#FFFFF5', fontVariant: ['tabular-nums'] },
  feePct: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#00E5A0' },
  // ─── Deposit Address Card ───
  depositCard: {
    marginHorizontal: 24, marginBottom: 16, backgroundColor: '#1A1A2E',
    borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.2)', borderRadius: 20, overflow: 'hidden',
  },
  dcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 12,
  },
  dcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dcIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,229,160,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dcTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFF5' },
  dcSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.5)', marginTop: 1 },
  // Network
  networkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  networkLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,245,0.5)' },
  networkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#222236', borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  networkIcon: { fontSize: 12 },
  networkName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFF5' },
  networkGas: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,245,0.4)' },
  // Address
  addressBox: {
    marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#111118',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 14, padding: 14,
  },
  addrLeft: { flex: 1 },
  addrMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15, color: '#FFFFF5', letterSpacing: 0.5,
  },
  addrHint: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,245,0.35)', marginTop: 3 },
  qrMini: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,229,160,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  // Copy
  copyBtn: {
    marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 12,
    paddingVertical: 12,
  },
  copyText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5' },
  copyTextGreen: { color: '#00E5A0' },
  // Warning
  warnRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
  },
  warnText: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,212,96,0.7)', lineHeight: 16,
  },
  // CTA
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  ctaNote: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.4)',
    textAlign: 'center', marginTop: 10,
  },
  // ─── Pickers (shared) ───
  cpItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  cpItemSel: { backgroundColor: 'rgba(0,229,160,0.08)' },
  cpIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cpIcon: { fontSize: 18 },
  cpInfo: { flex: 1 },
  cpName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFF5' },
  cpSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.6)' },
  // ─── QR Sheet ───
  qrSheet: { alignItems: 'center', paddingHorizontal: 24 },
  qrBox: {
    width: 220, height: 220, backgroundColor: '#FFFFF5', borderRadius: 16,
    padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 195, height: 195 },
  qrCell: { width: 15, height: 15 },
  qrCellFilled: { backgroundColor: '#111118' },
  qrInfo: { alignItems: 'center', marginBottom: 16 },
  qrNetwork: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5', marginBottom: 6 },
  qrAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, color: 'rgba(255,255,245,0.6)', textAlign: 'center', lineHeight: 18,
  },
  qrCopyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#00E5A0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12,
  },
  qrCopyText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#111118' },
  qrWarn: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.4)', textAlign: 'center',
  },
  // ─── PIN Sheet ───
  pinSheet: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 12 },
  pinLockIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  pinTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFF5', marginBottom: 4 },
  pinSubtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,245,0.5)',
    textAlign: 'center', marginBottom: 24,
  },
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    borderColor: 'rgba(255,255,245,0.15)', backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: '#00E5A0', borderColor: '#00E5A0' },
  pinDotError: { backgroundColor: '#FF4D6A', borderColor: '#FF4D6A' },
  pinErrorText: {
    fontFamily: 'Inter_500Medium', fontSize: 12, color: '#FF4D6A', marginBottom: 8,
  },
  coinLogo: { width: 20, height: 20, borderRadius: 10 },
  cpLogo: { width: 36, height: 36, borderRadius: 18 },
});

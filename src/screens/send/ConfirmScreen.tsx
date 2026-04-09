import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
import { ScreenHeader, GradientAvatar, CTAButton, BottomSheet, Toast } from '../../components';
import { networkLogos } from '../../data/cryptoIcons';
import { createTransaction } from '../../api/transactions';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'Confirm'>;

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const networks = [
  { id: 'polygon', name: 'Polygon', icon: '\u{1F7E3}', gas: '~$0.01', address: '0x4c2A9f8E3d7B6a1C0e5F2d8A9b4C7e6F3a1D5b' },
  { id: 'ethereum', name: 'Ethereum', icon: '\u{1F4A0}', gas: '~$2.50', address: '0x7a3B8c9D1e2F3a4B5c6D7e8F9a0B1c2D3e4F2e' },
  { id: 'base', name: 'Base', icon: '\u{1F535}', gas: '~$0.05', address: '0x1e8B4f7A2c9D3e6F5a0B8c1D4e7F9a2B5c3D6e' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '\u{1F4A0}', gas: '~$0.15', address: '0x9d5F2e8A1b3C7d6E0f4A8B9c2D5e7F1a3B6c4d' },
  { id: 'bsc', name: 'BNB Chain', icon: '\u{1F7E1}', gas: '~$0.10', address: '0x2f9A3e8B1c4D7a6E5f0B8c1D9e3F2a4B6c5D7e' },
];

const networkIconMap: Record<string, string> = {
  Polygon: 'triangle-outline',
  Ethereum: 'logo-electron',
  Base: 'layers-outline',
  Arbitrum: 'git-branch-outline',
  'BNB Chain': 'logo-bitcoin',
};

const truncateAddress = (addr: string): string => {
  if (!addr || addr.length <= 14) return addr || '';
  return `${addr.slice(0, 8)}\u2026${addr.slice(-6)}`;
};

export const ConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    amount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
    recipientName,
    recipientInitials,
    recipientColors,
    recipientMethod,
    recipientFlag,
    recipientWalletAddress,
    recipientNetwork,
    corridorId,
  } = route.params;

  const isCryptoOut = receiveCurrency === 'USDT';
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const fee = isCryptoOut
    ? Math.round(amount * 0.01)
    : Math.round(receiveAmount * 0.01);
  const feePct = isCryptoOut
    ? ((fee / amount) * 100).toFixed(2)
    : ((fee / receiveAmount) * 100).toFixed(2);

  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const shortAddr = `${selectedNetwork.address.slice(0, 8)}\u2026${selectedNetwork.address.slice(-6)}`;

  const handleCopy = useCallback(async () => {
    const addressToCopy = isCryptoOut ? recipientWalletAddress : selectedNetwork.address;
    if (addressToCopy) {
      await Clipboard.setStringAsync(addressToCopy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [isCryptoOut, recipientWalletAddress, selectedNetwork.address]);

  const handleProceed = useCallback(async () => {
    setLoading(true);
    setShowError(false);

    try {
      const response = await createTransaction({
        corridorId: corridorId || 'sg-ng',
        sendAmount: amount,
        sendCurrency,
        receiveCurrency,
        receiveAmount,
        recipientName,
        recipientAccountType: isCryptoOut ? 'wallet' : (recipientMethod?.toLowerCase().includes('bank') ? 'bank' : 'mobile_money'),
        recipientAccountLabel: recipientMethod || 'Unknown',
        recipientWalletAddress,
        recipientNetwork,
        depositNetwork: selectedNetwork.name,
        depositAddress: selectedNetwork.address,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.navigate('DepositWaiting', {
        transactionSlug: response.slug,
        transactionId: response.id,
        recipientName,
        recipientMethod,
        recipientFlag,
        amount,
        receiveAmount,
        sendCurrency,
        recvCurrency: receiveCurrency,
        walletAddress: selectedNetwork.address,
        network: selectedNetwork.name,
        recipientWalletAddress,
        recipientNetwork,
      });
    } catch (error) {
      setErrorMessage('Failed to create transaction. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, [
    navigation, recipientName, recipientMethod, recipientFlag, amount, receiveAmount,
    sendCurrency, receiveCurrency, selectedNetwork, recipientWalletAddress, recipientNetwork,
    corridorId, isCryptoOut
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Toast
        visible={showError}
        message={errorMessage}
        type="error"
        onDismiss={() => setShowError(false)}
      />
      <ScreenHeader title="Confirm" onBack={() => navigation.goBack()} />
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
            {isCryptoOut ? (
              <View style={styles.rsWalletRow}>
                <Text style={styles.rsWalletAddr}>{truncateAddress(recipientWalletAddress || '')}</Text>
                <View style={styles.rsNetworkBadge}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={10} color="#00E5A0" />
                  <Text style={styles.rsNetworkText}>{recipientNetwork}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.rsSub}>{recipientMethod} {'\u00B7'} No Qupay account needed</Text>
            )}
          </View>
          <View style={styles.vtag}>
            <Ionicons name="checkmark" size={10} color="#00E5A0" />
            <Text style={styles.vtagText}>Verified</Text>
          </View>
        </View>

        {/* Swap summary */}
        <View style={styles.swapCard}>
          <View style={styles.swapRow}>
            <Text style={styles.swapLabel}>You send</Text>
            <Text style={styles.swapValue}>{sendSymbol}{amount.toLocaleString()} {sendCurrency}</Text>
          </View>
          <View style={styles.swapDivider} />
          <View style={styles.swapRow}>
            <Text style={styles.swapLabel}>They receive</Text>
            <Text style={styles.swapValueGreen}>
              {isCryptoOut
                ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
          </View>
        </View>

        {/* Fee + delivery */}
        <View style={styles.metaRows}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Fee included</Text>
            <Text style={styles.feeValue}>
              {isCryptoOut ? `${sendSymbol}${fee.toLocaleString()}` : `${recvSymbol}${fee.toLocaleString()}`} <Text style={styles.feePct}>{feePct}%</Text>
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Delivery</Text>
            <View style={styles.deliveryPill}>
              <Ionicons name="flash" size={11} color="#00E5A0" />
              <Text style={styles.deliveryText}>~2 min via {isCryptoOut ? recipientNetwork : recipientMethod}</Text>
            </View>
          </View>
        </View>

        {isCryptoOut ? (
          <>
            {/* Recipient Wallet Card - for crypto out */}
            <View style={styles.walletCard}>
              <View style={styles.wcHeader}>
                <View style={styles.wcHeaderLeft}>
                  <View style={styles.wcIcon}>
                    <Ionicons name="wallet-outline" size={18} color="#00E5A0" />
                  </View>
                  <View>
                    <Text style={styles.wcTitle}>Recipient Wallet</Text>
                    <Text style={styles.wcSubtitle}>
                      {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT will be sent to this address
                    </Text>
                  </View>
                </View>
              </View>

              {/* Network display */}
              <View style={styles.wcNetworkRow}>
                <Text style={styles.wcNetworkLabel}>Network</Text>
                <View style={styles.wcNetworkPill}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={14} color="#00E5A0" />
                  <Text style={styles.wcNetworkName}>{recipientNetwork}</Text>
                </View>
              </View>

              {/* Address display */}
              <View style={styles.wcAddressBox}>
                <Text style={styles.wcAddrMono} selectable>{recipientWalletAddress}</Text>
              </View>

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

              {/* Info */}
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={14} color="#00E5A0" />
                <Text style={styles.infoText}>
                  Funds will be sent as USDT on {recipientNetwork} to the recipient's wallet
                </Text>
              </View>
            </View>

            {/* Pay with section */}
            <View style={styles.payWithCard}>
              <View style={styles.pwHeader}>
                <View style={styles.pwIcon}>
                  <Ionicons name="card-outline" size={18} color="#1a6fff" />
                </View>
                <View>
                  <Text style={styles.pwTitle}>Pay with</Text>
                  <Text style={styles.pwSubtitle}>Select a payment method</Text>
                </View>
              </View>

              {/* Mock payment method */}
              <View style={styles.paymentMethod}>
                <View style={styles.pmLeft}>
                  <View style={styles.pmIconWrap}>
                    <Ionicons name="business" size={16} color="#FFFFF5" />
                  </View>
                  <View>
                    <Text style={styles.pmTitle}>GTBank</Text>
                    <Text style={styles.pmSub}>Account ending ****4521</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#00E5A0" />
              </View>

              <View style={styles.paymentMethodAlt}>
                <View style={styles.pmLeft}>
                  <View style={[styles.pmIconWrap, { backgroundColor: 'rgba(255,255,245,0.08)' }]}>
                    <Ionicons name="card" size={16} color="rgba(255,255,245,0.5)" />
                  </View>
                  <View>
                    <Text style={styles.pmTitleAlt}>Debit Card</Text>
                    <Text style={styles.pmSubAlt}>Visa ending ****8912</Text>
                  </View>
                </View>
                <View style={styles.pmRadio} />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Deposit Address Card - for crypto in */}
            <View style={styles.depositCard}>
              <View style={styles.dcHeader}>
                <View style={styles.dcHeaderLeft}>
                  <View style={styles.dcIcon}>
                    <Ionicons name="wallet-outline" size={18} color="#00E5A0" />
                  </View>
                  <View>
                    <Text style={styles.dcTitle}>Deposit Address</Text>
                    <Text style={styles.dcSubtitle}>
                      Send exactly {amount} {sendCurrency} to this address
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
                  Only send {sendCurrency} on {selectedNetwork.name}. Sending other tokens or using a different network may result in loss of funds.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <CTAButton
            title={isCryptoOut ? 'Pay Now' : 'Proceed'}
            onPress={handleProceed}
            loading={loading}
          />
          <Text style={styles.ctaNote}>
            {isCryptoOut
              ? `You will be charged ${sendSymbol}${amount.toLocaleString()} ${sendCurrency}`
              : 'Make sure to copy the deposit address before proceeding'}
          </Text>
        </View>
      </ScrollView>

      {/* Network Picker - only for crypto in */}
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

      {/* QR Code Sheet - only for crypto in */}
      <BottomSheet visible={showQR} onClose={() => setShowQR(false)} title="Scan to Deposit">
        <View style={styles.qrSheet}>
          <View style={styles.qrBox}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 169 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    (i * 7 + i * i * 3) % 3 !== 0 && styles.qrCellFilled,
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
            Send exactly {amount} {sendCurrency} on {selectedNetwork.name}
          </Text>
        </View>
        <View style={{ height: 30 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  recipStrip: {
    marginHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 12,
  },
  rsInfo: { flex: 1 },
  rsName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5' },
  rsSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.6)' },
  rsWalletRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
  },
  rsWalletAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10, color: 'rgba(255,255,245,0.5)',
  },
  rsNetworkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,160,0.1)', borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 6,
  },
  rsNetworkText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#00E5A0',
  },
  vtag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,229,160,0.12)', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
  },
  vtagText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#00E5A0' },
  swapCard: {
    marginHorizontal: 24, marginBottom: 16, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 14, padding: 16,
  },
  swapRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  swapDivider: {
    height: 1, backgroundColor: 'rgba(255,255,245,0.08)', marginVertical: 12,
  },
  swapLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,245,0.6)',
  },
  swapValue: {
    fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFF5',
  },
  swapValueGreen: {
    fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#00E5A0',
  },
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
  // Wallet card for crypto-out
  walletCard: {
    marginHorizontal: 24, marginBottom: 16, backgroundColor: '#1A1A2E',
    borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.2)', borderRadius: 20, overflow: 'hidden',
  },
  wcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 12,
  },
  wcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wcIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,229,160,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  wcTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFF5' },
  wcSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.5)', marginTop: 1 },
  wcNetworkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  wcNetworkLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,245,0.5)' },
  wcNetworkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,229,160,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,160,0.25)',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  wcNetworkName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFF5' },
  wcAddressBox: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111118',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 14, padding: 14,
  },
  wcAddrMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12, color: '#FFFFF5', letterSpacing: 0.3, lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
  },
  infoText: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(0,229,160,0.7)', lineHeight: 16,
  },
  // Pay with card
  payWithCard: {
    marginHorizontal: 24, marginBottom: 16, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 16, padding: 16,
  },
  pwHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  pwIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(26,111,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  pwTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFF5' },
  pwSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.5)', marginTop: 1 },
  paymentMethod: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,229,160,0.08)', borderWidth: 1.5, borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  paymentMethodAlt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,245,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12, padding: 14,
  },
  pmLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pmIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#008751',
    alignItems: 'center', justifyContent: 'center',
  },
  pmTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5' },
  pmSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.5)', marginTop: 1 },
  pmTitleAlt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(255,255,245,0.6)' },
  pmSubAlt: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.35)', marginTop: 1 },
  pmRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,245,0.2)',
  },
  // Deposit card for crypto-in (existing)
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
  copyBtn: {
    marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: '#222236',
    borderWidth: 1, borderColor: 'rgba(255,255,245,0.08)', borderRadius: 12,
    paddingVertical: 12,
  },
  copyText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFF5' },
  copyTextGreen: { color: '#00E5A0' },
  warnRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
  },
  warnText: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,212,96,0.7)', lineHeight: 16,
  },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  ctaNote: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.4)',
    textAlign: 'center', marginTop: 10,
  },
  cpItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  cpItemSel: { backgroundColor: 'rgba(0,229,160,0.08)' },
  cpInfo: { flex: 1 },
  cpName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFF5' },
  cpSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,245,0.6)' },
  cpLogo: { width: 36, height: 36, borderRadius: 18 },
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
});

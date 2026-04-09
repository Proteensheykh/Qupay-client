import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, Avatar, CTAButton, BottomSheet, Toast } from '../../components';
import { networkLogos } from '../../data/cryptoIcons';
import { createTransaction } from '../../api/transactions';
import { useTransactionStore } from '../../store/transactionStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<SendFlowParamList, 'Confirm'>;
type Stage = 'confirm' | 'detecting';

interface RadarStep {
  label: string;
  sub: string;
  icon: string;
}

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

  const { theme } = useTheme();
  const updateStatus = useTransactionStore((state) => state.updateStatus);

  const isCryptoOut = receiveCurrency === 'USDT';
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';
  const fee = isCryptoOut
    ? Math.round(amount * 0.01)
    : Math.round(receiveAmount * 0.01);
  const feePct = isCryptoOut
    ? ((fee / amount) * 100).toFixed(2)
    : ((fee / receiveAmount) * 100).toFixed(2);
  const firstName = recipientName.split(' ')[0];

  const formatUSDT = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const [stage, setStage] = useState<Stage>('confirm');
  const [processingStep, setProcessingStep] = useState(0);
  const [pulseOn, setPulseOn] = useState(true);
  const [spinDeg, setSpinDeg] = useState(0);
  const [transactionId, setTransactionId] = useState<string | undefined>();

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const RADAR_STEPS: RadarStep[] = isCryptoOut
    ? [
        { label: 'Processing payment', sub: `Confirming your ${sendSymbol}${amount.toLocaleString()} ${sendCurrency} payment`, icon: 'card-outline' },
        { label: 'Payment confirmed', sub: `${sendSymbol}${amount.toLocaleString()} ${sendCurrency} received`, icon: 'checkmark-circle' },
        { label: 'Converting to crypto', sub: `${formatUSDT(receiveAmount)} USDT being prepared`, icon: 'swap-horizontal' },
        { label: `Sending to ${firstName}`, sub: `Releasing to ${recipientNetwork} wallet`, icon: 'send' },
        { label: 'Delivered!', sub: `${firstName} received ${formatUSDT(receiveAmount)} USDT`, icon: 'checkmark' },
      ]
    : [
        { label: 'Scanning blockchain...', sub: `Looking for ${amount} ${sendCurrency} on ${selectedNetwork.name}`, icon: 'search' },
        { label: 'Deposit detected', sub: `${amount} ${sendCurrency} confirmed on ${selectedNetwork.name}`, icon: 'checkmark-circle' },
        { label: 'Converting to local currency', sub: `${recvSymbol}${receiveAmount.toLocaleString()} being prepared`, icon: 'swap-horizontal' },
        { label: `Sending to ${firstName}`, sub: `Releasing to ${recipientMethod}`, icon: 'send' },
        { label: 'Delivered!', sub: `${firstName} received ${recvSymbol}${receiveAmount.toLocaleString()}`, icon: 'checkmark' },
      ];

  useEffect(() => {
    if (stage !== 'detecting') return;

    const pulseInterval = setInterval(() => {
      setPulseOn((p) => !p);
    }, 800);
    intervalsRef.current.push(pulseInterval);

    const spinInterval = setInterval(() => {
      setSpinDeg((d) => (d + 30) % 360);
    }, 100);
    intervalsRef.current.push(spinInterval);

    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
  }, [stage]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

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

  const startDetectingFlow = useCallback((txId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStage('detecting');
    setProcessingStep(0);

    const t1 = setTimeout(() => {
      setProcessingStep(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (txId) updateStatus(txId, 'DEPOSIT_CONFIRMED');
    }, 3000);
    timeoutsRef.current.push(t1);

    const t2 = setTimeout(() => {
      setProcessingStep(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (txId) updateStatus(txId, 'MATCHED');
    }, 5500);
    timeoutsRef.current.push(t2);

    const t3 = setTimeout(() => {
      setProcessingStep(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (txId) updateStatus(txId, 'SETTLEMENT_IN_PROGRESS');
    }, 8000);
    timeoutsRef.current.push(t3);

    const t4 = setTimeout(() => {
      setProcessingStep(4);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (txId) updateStatus(txId, 'COMPLETED');

      const t5 = setTimeout(() => {
        const tabs = navigation.getParent();
        if (tabs) {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Amount' }] }));
          setTimeout(() => {
            tabs.navigate('HistoryTab', {
              screen: 'TransferDetail',
              params: { transferId: '1', status: 'delivered' },
            });
          }, 100);
        }
      }, 1500);
      timeoutsRef.current.push(t5);
    }, 10000);
    timeoutsRef.current.push(t4);
  }, [navigation, updateStatus]);

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
      setTransactionId(response.id);
      setLoading(false);
      startDetectingFlow(response.id);
    } catch (error) {
      setErrorMessage('Failed to create transaction. Please try again.');
      setShowError(true);
      setLoading(false);
    }
  }, [
    amount, sendCurrency, receiveCurrency, receiveAmount, recipientName, recipientMethod,
    recipientWalletAddress, recipientNetwork, selectedNetwork, corridorId, isCryptoOut,
    startDetectingFlow
  ]);

  const currentStep = RADAR_STEPS[processingStep] || RADAR_STEPS[0];
  const isDone = processingStep >= 4;
  const ringColor = isDone ? theme.success.main : theme.secondary.main;
  const gradientTop = processingStep <= 1
    ? theme.info.bg
    : processingStep <= 3
      ? theme.action.selected
      : theme.success.bg;

  if (stage === 'detecting') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top', 'bottom']}>
        <LinearGradient
          colors={[gradientTop, 'transparent']}
          locations={[0, 0.6]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.detectingContainer}>
          <View style={styles.radarWrap}>
            <View
              style={[
                styles.radarRing3,
                {
                  borderColor: ringColor,
                  opacity: pulseOn ? 0.25 : 0.12,
                  transform: [{ scale: pulseOn ? 1.02 : 1 }],
                },
              ]}
            />
            <View
              style={[
                styles.radarRing2,
                {
                  borderColor: ringColor,
                  opacity: pulseOn ? 0.35 : 0.18,
                  transform: [{ scale: pulseOn ? 1.03 : 1 }],
                },
              ]}
            />
            <View
              style={[
                styles.radarRing1,
                {
                  borderColor: ringColor,
                  opacity: pulseOn ? 0.5 : 0.28,
                },
              ]}
            />
            <View
              style={[
                styles.radarCenter,
                {
                  backgroundColor: isDone ? theme.success.bg : theme.info.bg,
                  transform: isDone ? [] : [{ rotate: `${spinDeg}deg` }],
                },
              ]}
            >
              <Ionicons
                name={currentStep.icon as any}
                size={32}
                color={ringColor}
              />
            </View>
          </View>

          <Text style={[styles.detectingTitle, { color: theme.text.primary }]}>{currentStep.label}</Text>
          <Text style={[styles.detectingSub, { color: theme.text.secondary }]}>{currentStep.sub}</Text>

          <View style={styles.radarDots}>
            {RADAR_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.radarDot,
                  { backgroundColor: theme.action.selected },
                  i <= processingStep && !isDone && { backgroundColor: theme.secondary.main },
                  i <= processingStep && isDone && { backgroundColor: theme.success.main },
                ]}
              />
            ))}
          </View>

          <View style={[styles.radarSummary, { backgroundColor: theme.background.paper }]}>
            <Text style={[styles.radarSummaryText, { color: theme.text.primary }]}>
              {sendSymbol}{amount.toLocaleString()} {sendCurrency} {'\u2192'}{' '}
              {isCryptoOut
                ? `${formatUSDT(receiveAmount)} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
            <Text style={[styles.radarSummaryRecipient, { color: theme.text.secondary }]}>
              to {recipientName} {'\u00B7'} {isCryptoOut ? recipientNetwork : recipientMethod}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
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
        <View style={[styles.recipStrip, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
          <Avatar seed={recipientName} size={34} />
          <View style={styles.rsInfo}>
            <Text style={[styles.rsName, { color: theme.text.primary }]}>{recipientName}</Text>
            {isCryptoOut ? (
              <View style={styles.rsWalletRow}>
                <Text style={[styles.rsWalletAddr, { color: theme.text.muted }]}>{truncateAddress(recipientWalletAddress || '')}</Text>
                <View style={[styles.rsNetworkBadge, { backgroundColor: theme.info.bg }]}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={10} color={theme.secondary.main} />
                  <Text style={[styles.rsNetworkText, { color: theme.secondary.main }]}>{recipientNetwork}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.rsSub, { color: theme.text.secondary }]}>{recipientMethod} {'\u00B7'} No Qupay account needed</Text>
            )}
          </View>
          <View style={[styles.vtag, { backgroundColor: theme.info.bg }]}>
            <Ionicons name="checkmark" size={10} color={theme.secondary.main} />
            <Text style={[styles.vtagText, { color: theme.secondary.main }]}>Verified</Text>
          </View>
        </View>

        {/* Swap summary */}
        <View style={[styles.swapCard, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>You send</Text>
            <Text style={[styles.swapValue, { color: theme.text.primary }]}>{sendSymbol}{amount.toLocaleString()} {sendCurrency}</Text>
          </View>
          <View style={[styles.swapDivider, { backgroundColor: theme.inputBorder }]} />
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>They receive</Text>
            <Text style={[styles.swapValueGreen, { color: theme.secondary.main }]}>
              {isCryptoOut
                ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
          </View>
        </View>

        {/* Fee + delivery */}
        <View style={styles.metaRows}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.text.secondary }]}>Fee included</Text>
            <Text style={[styles.feeValue, { color: theme.text.primary }]}>
              {isCryptoOut ? `${sendSymbol}${fee.toLocaleString()}` : `${recvSymbol}${fee.toLocaleString()}`} <Text style={[styles.feePct, { color: theme.secondary.main }]}>{feePct}%</Text>
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.text.secondary }]}>Delivery</Text>
            <View style={styles.deliveryPill}>
              <Ionicons name="flash" size={11} color={theme.secondary.main} />
              <Text style={[styles.deliveryText, { color: theme.secondary.main }]}>~2 min via {isCryptoOut ? recipientNetwork : recipientMethod}</Text>
            </View>
          </View>
        </View>

        {isCryptoOut ? (
          <>
            {/* Recipient Wallet Card - for crypto out */}
            <View style={[styles.walletCard, { backgroundColor: theme.background.surface, borderColor: theme.info.bg }]}>
              <View style={styles.wcHeader}>
                <View style={styles.wcHeaderLeft}>
                  <View style={[styles.wcIcon, { backgroundColor: theme.info.bg }]}>
                    <Ionicons name="wallet-outline" size={18} color={theme.secondary.main} />
                  </View>
                  <View>
                    <Text style={[styles.wcTitle, { color: theme.text.primary }]}>Recipient Wallet</Text>
                    <Text style={[styles.wcSubtitle, { color: theme.text.muted }]}>
                      {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT will be sent to this address
                    </Text>
                  </View>
                </View>
              </View>

              {/* Network display */}
              <View style={styles.wcNetworkRow}>
                <Text style={[styles.wcNetworkLabel, { color: theme.text.muted }]}>Network</Text>
                <View style={[styles.wcNetworkPill, { backgroundColor: theme.info.bg, borderColor: theme.secondary.main }]}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={14} color={theme.secondary.main} />
                  <Text style={[styles.wcNetworkName, { color: theme.text.primary }]}>{recipientNetwork}</Text>
                </View>
              </View>

              {/* Address display */}
              <View style={[styles.wcAddressBox, { backgroundColor: theme.background.default, borderColor: theme.inputBorder }]}>
                <Text style={[styles.wcAddrMono, { color: theme.text.primary }]} selectable>{recipientWalletAddress}</Text>
              </View>

              {/* Copy button */}
              <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]} onPress={handleCopy} activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color={copied ? theme.secondary.main : theme.text.primary}
                />
                <Text style={[styles.copyText, { color: copied ? theme.secondary.main : theme.text.primary }]}>
                  {copied ? 'Copied!' : 'Copy address'}
                </Text>
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={14} color={theme.secondary.main} />
                <Text style={[styles.infoText, { color: theme.info.text }]}>
                  Funds will be sent as USDT on {recipientNetwork} to the recipient's wallet
                </Text>
              </View>
            </View>

            {/* Pay with section */}
            <View style={[styles.payWithCard, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
              <View style={styles.pwHeader}>
                <View style={[styles.pwIcon, { backgroundColor: theme.info.bg }]}>
                  <Ionicons name="card-outline" size={18} color={theme.secondary.main} />
                </View>
                <View>
                  <Text style={[styles.pwTitle, { color: theme.text.primary }]}>Pay with</Text>
                  <Text style={[styles.pwSubtitle, { color: theme.text.muted }]}>Select a payment method</Text>
                </View>
              </View>

              {/* Mock payment method */}
              <View style={[styles.paymentMethod, { backgroundColor: theme.info.bg, borderColor: theme.secondary.light }]}>
                <View style={styles.pmLeft}>
                  <View style={[styles.pmIconWrap, { backgroundColor: theme.success.main }]}>
                    <Ionicons name="business" size={16} color={theme.text.primary} />
                  </View>
                  <View>
                    <Text style={[styles.pmTitle, { color: theme.text.primary }]}>GTBank</Text>
                    <Text style={[styles.pmSub, { color: theme.text.muted }]}>Account ending ****4521</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={theme.secondary.main} />
              </View>

              <View style={[styles.paymentMethodAlt, { backgroundColor: theme.divider, borderColor: theme.inputBorder }]}>
                <View style={styles.pmLeft}>
                  <View style={[styles.pmIconWrap, { backgroundColor: theme.inputBorder }]}>
                    <Ionicons name="card" size={16} color={theme.text.muted} />
                  </View>
                  <View>
                    <Text style={[styles.pmTitleAlt, { color: theme.text.secondary }]}>Debit Card</Text>
                    <Text style={[styles.pmSubAlt, { color: theme.text.disabled }]}>Visa ending ****8912</Text>
                  </View>
                </View>
                <View style={[styles.pmRadio, { borderColor: theme.text.disabled }]} />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Deposit Address Card - for crypto in */}
            <View style={[styles.depositCard, { backgroundColor: theme.background.surface, borderColor: theme.info.bg }]}>
              <View style={styles.dcHeader}>
                <View style={styles.dcHeaderLeft}>
                  <View style={[styles.dcIcon, { backgroundColor: theme.info.bg }]}>
                    <Ionicons name="wallet-outline" size={18} color={theme.secondary.main} />
                  </View>
                  <View>
                    <Text style={[styles.dcTitle, { color: theme.text.primary }]}>Deposit Address</Text>
                    <Text style={[styles.dcSubtitle, { color: theme.text.muted }]}>
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
                <Text style={[styles.networkLabel, { color: theme.text.muted }]}>Network</Text>
                <View style={[styles.networkPill, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
                  <Text style={styles.networkIcon}>{selectedNetwork.icon}</Text>
                  <Text style={[styles.networkName, { color: theme.text.primary }]}>{selectedNetwork.name}</Text>
                  <Text style={[styles.networkGas, { color: theme.text.muted }]}>{selectedNetwork.gas} gas</Text>
                  <Ionicons name="chevron-down" size={12} color={theme.text.muted} />
                </View>
              </TouchableOpacity>

              {/* Address display */}
              <TouchableOpacity
                style={[styles.addressBox, { backgroundColor: theme.background.default, borderColor: theme.inputBorder }]}
                onPress={() => setShowQR(true)}
                activeOpacity={0.7}
              >
                <View style={styles.addrLeft}>
                  <Text style={[styles.addrMono, { color: theme.text.primary }]}>{shortAddr}</Text>
                  <Text style={[styles.addrHint, { color: theme.text.disabled }]}>Tap to show QR code</Text>
                </View>
                <View style={[styles.qrMini, { backgroundColor: theme.info.bg, borderColor: theme.info.bg }]}>
                  <Ionicons name="qr-code-outline" size={28} color={theme.secondary.main} />
                </View>
              </TouchableOpacity>

              {/* Copy button */}
              <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]} onPress={handleCopy} activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color={copied ? theme.secondary.main : theme.text.primary}
                />
                <Text style={[styles.copyText, { color: copied ? theme.secondary.main : theme.text.primary }]}>
                  {copied ? 'Copied!' : 'Copy address'}
                </Text>
              </TouchableOpacity>

              {/* Warning */}
              <View style={styles.warnRow}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.warning.main} />
                <Text style={[styles.warnText, { color: theme.warning.text }]}>
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
          <Text style={[styles.ctaNote, { color: theme.text.muted }]}>
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
            style={[styles.cpItem, { borderBottomColor: theme.inputBorder }, selectedNetwork.id === n.id && { backgroundColor: theme.info.bg }]}
            onPress={() => { setSelectedNetwork(n); setShowNetworkPicker(false); setCopied(false); }}
            activeOpacity={0.7}
          >
            <Image source={{ uri: networkLogos[n.id] }} style={styles.cpLogo} />
            <View style={styles.cpInfo}>
              <Text style={[styles.cpName, { color: theme.text.primary }]}>{n.name}</Text>
              <Text style={[styles.cpSub, { color: theme.text.secondary }]}>Gas {n.gas}</Text>
            </View>
            {selectedNetwork.id === n.id && <Ionicons name="checkmark" size={18} color={theme.secondary.main} />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* QR Code Sheet - only for crypto in */}
      <BottomSheet visible={showQR} onClose={() => setShowQR(false)} title="Scan to Deposit">
        <View style={styles.qrSheet}>
          <View style={[styles.qrBox, { backgroundColor: theme.background.paper }]}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 169 }).map((_, i) => {
                const qrFilled =
                  (i * 7 + i * i * 3) % 3 !== 0 ||
                  (i % 13 < 3 && Math.floor(i / 13) < 3) ||
                  (i % 13 > 9 && Math.floor(i / 13) < 3) ||
                  (i % 13 < 3 && Math.floor(i / 13) > 9);
                return (
                  <View
                    key={i}
                    style={[styles.qrCell, qrFilled && { backgroundColor: theme.background.default }]}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.qrInfo}>
            <Text style={[styles.qrNetwork, { color: theme.text.primary }]}>{selectedNetwork.icon} {selectedNetwork.name}</Text>
            <Text style={[styles.qrAddr, { color: theme.text.secondary }]} selectable>{selectedNetwork.address}</Text>
          </View>
          <TouchableOpacity style={[styles.qrCopyBtn, { backgroundColor: theme.secondary.main }]} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={theme.background.default} />
            <Text style={[styles.qrCopyText, { color: theme.background.default }]}>{copied ? 'Copied!' : 'Copy address'}</Text>
          </TouchableOpacity>
          <Text style={[styles.qrWarn, { color: theme.text.muted }]}>
            Send exactly {amount} {sendCurrency} on {selectedNetwork.name}
          </Text>
        </View>
        <View style={{ height: 30 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  detectingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  radarWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  radarRing3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  radarRing2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  radarRing1: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 2.5,
  },
  radarCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  detectingSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  radarDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarSummary: {
    alignItems: 'center',
    marginTop: 32,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  radarSummaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  radarSummaryRecipient: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  recipStrip: {
    marginHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderRadius: 12,
  },
  rsInfo: { flex: 1 },
  rsName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  rsSub: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  rsWalletRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
  },
  rsWalletAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
  },
  rsNetworkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 6,
  },
  rsNetworkText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 9,
  },
  vtag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
  },
  vtagText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  swapCard: {
    marginHorizontal: 24, marginBottom: 16,
    borderWidth: 1, borderRadius: 14, padding: 16,
  },
  swapRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  swapDivider: {
    height: 1, marginVertical: 12,
  },
  swapLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
  },
  swapValue: {
    fontFamily: 'Inter_600SemiBold', fontSize: 15,
  },
  swapValueGreen: {
    fontFamily: 'Inter_600SemiBold', fontSize: 15,
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
    fontFamily: 'Inter_600SemiBold', fontSize: 12,
  },
  feeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  feeValue: { fontFamily: 'Inter_500Medium', fontSize: 12, fontVariant: ['tabular-nums'] },
  feePct: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  walletCard: {
    marginHorizontal: 24, marginBottom: 16,
    borderWidth: 1.5, borderRadius: 20, overflow: 'hidden',
  },
  wcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 12,
  },
  wcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wcIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  wcTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  wcSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  wcNetworkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  wcNetworkLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  wcNetworkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  wcNetworkName: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  wcAddressBox: {
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  wcAddrMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12, letterSpacing: 0.3, lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
  },
  infoText: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16,
  },
  payWithCard: {
    marginHorizontal: 24, marginBottom: 16,
    borderWidth: 1, borderRadius: 16, padding: 16,
  },
  pwHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  pwIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pwTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  pwSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  paymentMethod: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  paymentMethodAlt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12, padding: 14,
  },
  pmLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pmIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pmTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  pmSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  pmTitleAlt: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  pmSubAlt: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  pmRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
  },
  depositCard: {
    marginHorizontal: 24, marginBottom: 16,
    borderWidth: 1.5, borderRadius: 20, overflow: 'hidden',
  },
  dcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 12,
  },
  dcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dcIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  dcTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  dcSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  networkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  networkLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  networkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  networkIcon: { fontSize: 12 },
  networkName: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  networkGas: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  addressBox: {
    marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  addrLeft: { flex: 1 },
  addrMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15, letterSpacing: 0.5,
  },
  addrHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  qrMini: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  copyBtn: {
    marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12,
  },
  copyText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  warnRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 16,
  },
  warnText: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16,
  },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  ctaNote: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    textAlign: 'center', marginTop: 10,
  },
  cpItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  cpInfo: { flex: 1 },
  cpName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  cpSub: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  cpLogo: { width: 36, height: 36, borderRadius: 18 },
  qrSheet: { alignItems: 'center', paddingHorizontal: 24 },
  qrBox: {
    width: 220, height: 220, borderRadius: 16,
    padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 195, height: 195 },
  qrCell: { width: 15, height: 15 },
  qrInfo: { alignItems: 'center', marginBottom: 16 },
  qrNetwork: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 6 },
  qrAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, textAlign: 'center', lineHeight: 18,
  },
  qrCopyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12,
  },
  qrCopyText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  qrWarn: {
    fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center',
  },
});

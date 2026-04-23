import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, Avatar, CTAButton, BottomSheet, Toast } from '../../components';
import { findNetworkLogo } from '../../data/logos';
import { createTransaction } from '../../api/transactions';
import { useTransactionStore } from '../../store/transactionStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';

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

  const updateStatus = useTransactionStore((state) => state.updateStatus);
  const hairline = borders.hairline.dark;

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
  const ringColor = isDone ? palette.status.positive : palette.royal[500];

  if (stage === 'detecting') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top', 'bottom']}>
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
                  backgroundColor: isDone ? 'rgba(122,232,112,0.12)' : palette.grey[800],
                  borderWidth: isDone ? 0 : 1,
                  borderColor: isDone ? 'transparent' : palette.material.lightThin,
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

          <Text style={[styles.detectingTitle, { color: palette.grey[300] }]}>{currentStep.label}</Text>
          <Text style={[styles.detectingSub, { color: palette.grey[500] }]}>{currentStep.sub}</Text>

          <View style={styles.radarDots}>
            {RADAR_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.radarDot,
                  { backgroundColor: palette.material.lightThin },
                  i <= processingStep && !isDone && { backgroundColor: palette.royal[500] },
                  i <= processingStep && isDone && { backgroundColor: palette.status.positive },
                ]}
              />
            ))}
          </View>

          <View style={[styles.radarSummary, { backgroundColor: palette.grey[800] }, hairline]}>
            <Text style={[styles.radarSummaryText, { color: palette.grey[300] }]}>
              {sendSymbol}{amount.toLocaleString()} {sendCurrency} {'\u2192'}{' '}
              {isCryptoOut
                ? `${formatUSDT(receiveAmount)} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
            <Text style={[styles.radarSummaryRecipient, { color: palette.grey[500] }]}>
              to {recipientName} {'\u00B7'} {isCryptoOut ? recipientNetwork : recipientMethod}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      <Toast
        visible={showError}
        message={errorMessage}
        type="error"
        onDismiss={() => setShowError(false)}
      />
      <ScreenHeader title="Confirm" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.reviewCard, { backgroundColor: palette.grey[800] }, hairline]}>
        {/* Recipient strip */}
        <View style={styles.recipStrip}>
          <Avatar seed={recipientName} size={34} />
          <View style={styles.rsInfo}>
            <Text style={[styles.rsName, { color: palette.grey[300] }]}>{recipientName}</Text>
            {isCryptoOut ? (
              <View style={styles.rsWalletRow}>
                <Text style={[styles.rsWalletAddr, { color: palette.grey[500] }]}>{truncateAddress(recipientWalletAddress || '')}</Text>
                <View style={[styles.rsNetworkBadge, { backgroundColor: palette.grey[900] }, hairline]}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={10} color={palette.grey[300]} />
                  <Text style={[styles.rsNetworkText, { color: palette.grey[300] }]}>{recipientNetwork}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.rsSub, { color: palette.grey[500] }]}>{recipientMethod} {'\u00B7'} No Qupay account needed</Text>
            )}
          </View>
          <View style={[styles.vtag, { backgroundColor: palette.grey[900] }, hairline]}>
            <Ionicons name="checkmark" size={10} color={palette.status.positive} />
            <Text style={[styles.vtagText, { color: palette.grey[300] }]}>Verified</Text>
          </View>
        </View>

        <View style={styles.reviewDivider} />

        {/* Swap summary — tabular rows */}
        <View style={styles.reviewPad}>
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>You send</Text>
            <Text style={[styles.swapValue, { color: palette.grey[300] }]}>{sendSymbol}{amount.toLocaleString()} {sendCurrency}</Text>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.swapRow}>
            <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>They receive</Text>
            <Text style={[styles.swapValue, { color: palette.grey[300] }]}>
              {isCryptoOut
                ? `${receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                : `${recvSymbol}${receiveAmount.toLocaleString()} ${receiveCurrency}`}
            </Text>
          </View>
        </View>

        <View style={styles.reviewDivider} />

        {/* Fee + delivery */}
        <View style={[styles.metaRows, styles.reviewPad]}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Fee included</Text>
            <Text style={[styles.feeValue, { color: palette.grey[300] }]}>
              {isCryptoOut ? `${sendSymbol}${fee.toLocaleString()}` : `${recvSymbol}${fee.toLocaleString()}`}{' '}
              <Text style={[styles.feePct, { color: palette.grey[500] }]}>{feePct}%</Text>
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Delivery</Text>
            <View style={styles.deliveryPill}>
              <Ionicons name="flash" size={11} color={palette.grey[500]} />
              <Text style={[styles.deliveryText, { color: palette.grey[300] }]}>
                ~2 min via {isCryptoOut ? recipientNetwork : recipientMethod}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewDivider} />

        {isCryptoOut ? (
          <>
            {/* Recipient Wallet - for crypto out */}
            <View style={styles.walletCard}>
              <View style={styles.wcHeader}>
                <View style={styles.wcHeaderLeft}>
                  <View style={[styles.wcIcon, { backgroundColor: palette.grey[900] }, hairline]}>
                    <Ionicons name="wallet-outline" size={18} color={palette.grey[300]} />
                  </View>
                  <View>
                    <Text style={[styles.wcTitle, { color: palette.grey[300] }]}>Recipient Wallet</Text>
                    <Text style={[styles.wcSubtitle, { color: palette.grey[500] }]}>
                      {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT will be sent to this address
                    </Text>
                  </View>
                </View>
              </View>

              {/* Network display */}
              <View style={styles.wcNetworkRow}>
                <Text style={[styles.wcNetworkLabel, { color: palette.grey[500] }]}>Network</Text>
                <View style={[styles.wcNetworkPill, { backgroundColor: palette.grey[900] }, hairline]}>
                  <Ionicons name={(networkIconMap[recipientNetwork || ''] || 'layers-outline') as any} size={14} color={palette.grey[300]} />
                  <Text style={[styles.wcNetworkName, { color: palette.grey[300] }]}>{recipientNetwork}</Text>
                </View>
              </View>

              {/* Address display */}
              <View style={[styles.wcAddressBox, { backgroundColor: palette.grey[900], borderColor: palette.material.lightThin }]}>
                <Text style={[styles.wcAddrMono, { color: palette.grey[300] }]} selectable>{recipientWalletAddress}</Text>
              </View>

              {/* Copy button */}
              <TouchableOpacity style={[styles.copyBtn, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]} onPress={handleCopy} activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color={copied ? palette.royal[500] : palette.grey[300]}
                />
                <Text style={[styles.copyText, { color: copied ? palette.royal[500] : palette.grey[300] }]}>
                  {copied ? 'Copied!' : 'Copy address'}
                </Text>
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={14} color={palette.grey[500]} />
                <Text style={[styles.infoText, { color: palette.grey[500] }]}>
                  Funds will be sent as USDT on {recipientNetwork} to the recipient's wallet
                </Text>
              </View>
            </View>

            <View style={styles.reviewDivider} />

            {/* Pay with section */}
            <View style={styles.payWithCard}>
              <View style={styles.pwHeader}>
                <View style={[styles.pwIcon, { backgroundColor: palette.grey[900] }, hairline]}>
                  <Ionicons name="card-outline" size={18} color={palette.grey[300]} />
                </View>
                <View>
                  <Text style={[styles.pwTitle, { color: palette.grey[300] }]}>Pay with</Text>
                  <Text style={[styles.pwSubtitle, { color: palette.grey[500] }]}>Select a payment method</Text>
                </View>
              </View>

              {/* Mock payment method */}
              <View style={[styles.paymentMethod, { backgroundColor: palette.grey[900] }, hairline]}>
                <View style={styles.pmLeft}>
                  <View style={[styles.pmIconWrap, { backgroundColor: palette.status.positive }]}>
                    <Ionicons name="business" size={16} color={palette.grey[900]} />
                  </View>
                  <View>
                    <Text style={[styles.pmTitle, { color: palette.grey[300] }]}>GTBank</Text>
                    <Text style={[styles.pmSub, { color: palette.grey[500] }]}>Account ending ****4521</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={palette.status.positive} />
              </View>

              <View style={[styles.paymentMethodAlt, { backgroundColor: palette.grey[900], borderColor: palette.material.lightThin }]}>
                <View style={styles.pmLeft}>
                  <View style={[styles.pmIconWrap, { backgroundColor: palette.grey[800] }]}>
                    <Ionicons name="card" size={16} color={palette.grey[500]} />
                  </View>
                  <View>
                    <Text style={[styles.pmTitleAlt, { color: palette.grey[500] }]}>Debit Card</Text>
                    <Text style={[styles.pmSubAlt, { color: palette.grey[600] }]}>Visa ending ****8912</Text>
                  </View>
                </View>
                <View style={[styles.pmRadio, { borderColor: palette.grey[600] }]} />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Deposit Address - for crypto in */}
            <View style={styles.depositCard}>
              <View style={styles.dcHeader}>
                <View style={styles.dcHeaderLeft}>
                  <View style={[styles.dcIcon, { backgroundColor: palette.grey[900] }, hairline]}>
                    <Ionicons name="wallet-outline" size={18} color={palette.grey[300]} />
                  </View>
                  <View>
                    <Text style={[styles.dcTitle, { color: palette.grey[300] }]}>Deposit Address</Text>
                    <Text style={[styles.dcSubtitle, { color: palette.grey[500] }]}>
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
                <Text style={[styles.networkLabel, { color: palette.grey[500] }]}>Network</Text>
                <View style={[styles.networkPill, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]}>
                  <Text style={styles.networkIcon}>{selectedNetwork.icon}</Text>
                  <Text style={[styles.networkName, { color: palette.grey[300] }]}>{selectedNetwork.name}</Text>
                  <Text style={[styles.networkGas, { color: palette.grey[500] }]}>{selectedNetwork.gas} gas</Text>
                  <Ionicons name="chevron-down" size={12} color={palette.grey[500]} />
                </View>
              </TouchableOpacity>

              {/* Address display */}
              <TouchableOpacity
                style={[styles.addressBox, { backgroundColor: palette.grey[900], borderColor: palette.material.lightThin }]}
                onPress={() => setShowQR(true)}
                activeOpacity={0.7}
              >
                <View style={styles.addrLeft}>
                  <Text style={[styles.addrMono, { color: palette.grey[300] }]}>{shortAddr}</Text>
                  <Text style={[styles.addrHint, { color: palette.grey[600] }]}>Tap to show QR code</Text>
                </View>
                <View style={[styles.qrMini, { backgroundColor: palette.grey[900] }, hairline]}>
                  <Ionicons name="qr-code-outline" size={28} color={palette.grey[300]} />
                </View>
              </TouchableOpacity>

              {/* Copy button */}
              <TouchableOpacity style={[styles.copyBtn, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]} onPress={handleCopy} activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color={copied ? palette.royal[500] : palette.grey[300]}
                />
                <Text style={[styles.copyText, { color: copied ? palette.royal[500] : palette.grey[300] }]}>
                  {copied ? 'Copied!' : 'Copy address'}
                </Text>
              </TouchableOpacity>

              {/* Warning */}
              <View style={styles.warnRow}>
                <Ionicons name="alert-circle-outline" size={14} color={palette.status.partial} />
                <Text style={[styles.warnText, { color: palette.grey[300] }]}>
                  Only send {sendCurrency} on {selectedNetwork.name}. Sending other tokens or using a different network may result in loss of funds.
                </Text>
              </View>
            </View>
          </>
        )}
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <CTAButton
            title={isCryptoOut ? 'Pay Now' : 'Proceed'}
            onPress={handleProceed}
            loading={loading}
          />
          <Text style={[styles.ctaNote, { color: palette.grey[500] }]}>
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
            style={[styles.cpItem, { borderBottomColor: palette.material.lightThin }, selectedNetwork.id === n.id && { backgroundColor: 'rgba(251,251,253,0.06)' }]}
            onPress={() => { setSelectedNetwork(n); setShowNetworkPicker(false); setCopied(false); }}
            activeOpacity={0.7}
          >
            <Image source={{ uri: findNetworkLogo(n.id)?.uri }} style={styles.cpLogo} />
            <View style={styles.cpInfo}>
              <Text style={[styles.cpName, { color: palette.grey[300] }]}>{n.name}</Text>
              <Text style={[styles.cpSub, { color: palette.grey[500] }]}>Gas {n.gas}</Text>
            </View>
            {selectedNetwork.id === n.id && <Ionicons name="checkmark" size={18} color={palette.royal[500]} />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      {/* QR Code Sheet - only for crypto in */}
      <BottomSheet visible={showQR} onClose={() => setShowQR(false)} title="Scan to Deposit">
        <View style={styles.qrSheet}>
          <View style={[styles.qrBox, { backgroundColor: palette.grey[800] }]}>
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
                    style={[styles.qrCell, qrFilled && { backgroundColor: palette.grey[900] }]}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.qrInfo}>
            <Text style={[styles.qrNetwork, { color: palette.grey[300] }]}>{selectedNetwork.icon} {selectedNetwork.name}</Text>
            <Text style={[styles.qrAddr, { color: palette.grey[500] }]} selectable>{selectedNetwork.address}</Text>
          </View>
          <TouchableOpacity style={[styles.qrCopyBtn, { backgroundColor: palette.royal[500] }]} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={palette.grey[100]} />
            <Text style={[styles.qrCopyText, { color: palette.grey[100] }]}>{copied ? 'Copied!' : 'Copy address'}</Text>
          </TouchableOpacity>
          <Text style={[styles.qrWarn, { color: palette.grey[500] }]}>
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
  scrollContent: {
    paddingBottom: spacing(6),
  },
  reviewCard: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(4),
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: palette.material.lightThin,
    width: '100%',
  },
  reviewPad: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
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
    ...typography.h3,
    marginBottom: 8,
    textAlign: 'center',
  },
  detectingSub: {
    ...typography.bodySm,
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
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  radarSummaryText: {
    ...typography.main14,
    fontVariant: ['tabular-nums'],
  },
  radarSummaryRecipient: {
    ...typography.secondary12,
    marginTop: 4,
  },
  recipStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
  },
  rsInfo: { flex: 1 },
  rsName: { ...typography.main14 },
  rsSub: { ...typography.secondary12 },
  rsWalletRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
  },
  rsWalletAddr: {
    ...typography.monoXs,
  },
  rsNetworkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.sm,
    paddingVertical: 2, paddingHorizontal: 6,
  },
  rsNetworkText: {
    ...typography.labelXs,
    textTransform: 'none',
    letterSpacing: 0,
  },
  vtag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 8,
  },
  vtagText: { ...typography.labelSm, textTransform: 'none', letterSpacing: 0 },
  swapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing(2),
  },
  swapLabel: {
    ...typography.subheader2,
    flexShrink: 0,
    paddingRight: spacing(2),
  },
  swapValue: {
    ...typography.main14,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flex: 1,
  },
  metaRows: {
    gap: spacing(2),
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  deliveryText: {
    ...typography.main12,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flexShrink: 1,
  },
  feeLabel: { ...typography.subheader2, flexShrink: 0 },
  feeValue: {
    ...typography.monoSm,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flex: 1,
  },
  feePct: { ...typography.monoXs, fontVariant: ['tabular-nums'] },
  walletCard: {
    paddingBottom: spacing(1),
  },
  wcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingTop: spacing(4), paddingBottom: spacing(3),
  },
  wcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wcIcon: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  wcTitle: { ...typography.h4 },
  wcSubtitle: { ...typography.secondary12, marginTop: 1 },
  wcNetworkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingBottom: spacing(3),
  },
  wcNetworkLabel: { ...typography.subheader2 },
  wcNetworkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
    borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12,
  },
  wcNetworkName: { ...typography.main12 },
  wcAddressBox: {
    marginHorizontal: spacing(4), marginBottom: spacing(3),
    borderWidth: 1, borderRadius: radii.md, padding: spacing(3),
  },
  wcAddrMono: {
    ...typography.monoSm,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: spacing(4), marginBottom: spacing(4),
  },
  infoText: {
    flex: 1, ...typography.helperText, lineHeight: 16,
  },
  payWithCard: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4),
  },
  pwHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing(4),
  },
  pwIcon: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  pwTitle: { ...typography.h4 },
  pwSubtitle: { ...typography.secondary12, marginTop: 1 },
  paymentMethod: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md, padding: spacing(3), marginBottom: 10,
  },
  paymentMethodAlt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md, padding: spacing(3),
  },
  pmLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pmIconWrap: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  pmTitle: { ...typography.main14 },
  pmSub: { ...typography.secondary12, marginTop: 1 },
  pmTitleAlt: { ...typography.main14 },
  pmSubAlt: { ...typography.secondary12, marginTop: 1 },
  pmRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
  },
  depositCard: {
    paddingBottom: spacing(1),
  },
  dcHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingTop: spacing(4), paddingBottom: spacing(3),
  },
  dcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dcIcon: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  dcTitle: { ...typography.h4 },
  dcSubtitle: { ...typography.secondary12, marginTop: 1 },
  networkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingBottom: spacing(3),
  },
  networkLabel: { ...typography.subheader2 },
  networkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
    borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12,
  },
  networkIcon: { fontSize: 12 },
  networkName: { ...typography.main12 },
  networkGas: { ...typography.helperText },
  addressBox: {
    marginHorizontal: spacing(4), marginBottom: spacing(3), flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radii.md, padding: spacing(3),
  },
  addrLeft: { flex: 1 },
  addrMono: {
    ...typography.valueSm,
  },
  addrHint: { ...typography.helperText, marginTop: 3 },
  qrMini: {
    width: 44, height: 44, borderRadius: radii.sm,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  copyBtn: {
    marginHorizontal: spacing(4), marginBottom: spacing(3), flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: radii.md,
    paddingVertical: 12,
  },
  copyText: { ...typography.buttonS },
  warnRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: spacing(4), marginBottom: spacing(4),
  },
  warnText: {
    flex: 1, ...typography.helperText, lineHeight: 16,
  },
  ctaWrap: { paddingHorizontal: spacing(6), paddingBottom: spacing(6) },
  ctaNote: {
    ...typography.helperText,
    textAlign: 'center', marginTop: 10,
  },
  cpItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  cpInfo: { flex: 1 },
  cpName: { ...typography.main14 },
  cpSub: { ...typography.secondary12 },
  cpLogo: { width: 36, height: 36, borderRadius: 18 },
  qrSheet: { alignItems: 'center', paddingHorizontal: 24 },
  qrBox: {
    width: 220, height: 220, borderRadius: radii.md,
    padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 195, height: 195 },
  qrCell: { width: 15, height: 15 },
  qrInfo: { alignItems: 'center', marginBottom: 16 },
  qrNetwork: { ...typography.main14, marginBottom: 6 },
  qrAddr: {
    ...typography.monoXs,
    textAlign: 'center', lineHeight: 18,
  },
  qrCopyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radii.xl, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12,
  },
  qrCopyText: { ...typography.buttonM },
  qrWarn: {
    ...typography.helperText, textAlign: 'center',
  },
});

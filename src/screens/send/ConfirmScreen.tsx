import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, Avatar, CTAButton, BottomSheet } from '../../components';
import { getRate } from '../../api/rates';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import { useRecentRecipientsStore } from '../../store/recentRecipientsStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import type { Recipient } from '../../types/transaction';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';

type Props = NativeStackScreenProps<SendFlowParamList, 'Confirm'>;

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', INR: '\u20B9', PHP: '\u20B1', MXN: '$', PKR: 'Rs', ZAR: 'R',
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
    recipientBankCode,
    recipientAccountNumber,
    recipientAccountName,
  } = route.params;

  const hairline = borders.hairline.light;
  const toast = useToast();
  const createTx = useCreateTransaction();
  const addRecent = useRecentRecipientsStore((s) => s.add);

  const isCryptoOut = receiveCurrency === 'USDT';
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';

  // Rate freshness
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateFetchedAt, setRateFetchedAt] = useState<Date | null>(null);
  const [rateFreshness, setRateFreshness] = useState('');
  const freshnessInterval = useRef<NodeJS.Timeout | null>(null);

  const liveReceiveAmount = liveRate
    ? Math.round(amount * liveRate * 100) / 100
    : receiveAmount;

  useEffect(() => {
    let mounted = true;
    setRateLoading(true);
    getRate(sendCurrency, receiveCurrency)
      .then((data) => {
        if (!mounted) return;
        setLiveRate(data.rate);
        setRateFetchedAt(new Date());
      })
      .catch(() => {
        if (!mounted) return;
        setLiveRate(null);
      })
      .finally(() => {
        if (mounted) setRateLoading(false);
      });
    return () => { mounted = false; };
  }, [sendCurrency, receiveCurrency]);

  useEffect(() => {
    if (!rateFetchedAt) return;
    const update = () => {
      const seconds = Math.round((Date.now() - rateFetchedAt.getTime()) / 1000);
      if (seconds < 5) setRateFreshness('Just now');
      else if (seconds < 60) setRateFreshness(`Updated ${seconds}s ago`);
      else setRateFreshness(`Updated ${Math.floor(seconds / 60)}m ago`);
    };
    update();
    freshnessInterval.current = setInterval(update, 1000);
    return () => {
      if (freshnessInterval.current) clearInterval(freshnessInterval.current);
    };
  }, [rateFetchedAt]);

  const refreshRate = useCallback(() => {
    setRateLoading(true);
    getRate(sendCurrency, receiveCurrency)
      .then((data) => {
        setLiveRate(data.rate);
        setRateFetchedAt(new Date());
      })
      .catch(() => {
        toast.error('Could not refresh rate');
      })
      .finally(() => setRateLoading(false));
  }, [sendCurrency, receiveCurrency, toast]);

  // PIN state
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const pinInputRef = useRef<TextInput>(null);

  const handleConfirm = useCallback(() => {
    setShowPin(true);
    setPin('');
    setPinError('');
    setTimeout(() => pinInputRef.current?.focus(), 300);
  }, []);

  const handlePinSubmit = useCallback(async () => {
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    const recipient: Recipient = isCryptoOut
      ? { walletAddress: recipientWalletAddress }
      : {
          bankCode: recipientBankCode,
          accountNumber: recipientAccountNumber,
          accountName: recipientAccountName,
        };

    try {
      const tx = await createTx.mutateAsync({
        fromCurrency: sendCurrency,
        toCurrency: receiveCurrency,
        amount,
        recipient,
        pin,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPin(false);

      // Save to recents
      if (isCryptoOut && recipientWalletAddress) {
        addRecent({
          channel: 'wallet',
          label: recipientName,
          data: { walletAddress: recipientWalletAddress, network: recipientNetwork || 'Solana' },
        });
      } else if (recipientBankCode && recipientAccountNumber) {
        addRecent({
          channel: 'bank',
          label: recipientAccountName || recipientName,
          data: {
            bankCode: recipientBankCode,
            bankName: recipientMethod || '',
            accountNumber: recipientAccountNumber,
            accountName: recipientAccountName || recipientName,
          },
        });
      }

      navigation.replace('TransactionStatus', { transactionId: tx.id });
    } catch (error) {
      const msg = getApiErrorMessage(error);
      if (msg.toLowerCase().includes('pin')) {
        setPinError(msg);
      } else {
        setShowPin(false);
        toast.error(msg);
      }
    }
  }, [
    pin, isCryptoOut, recipientWalletAddress, recipientBankCode,
    recipientAccountNumber, recipientAccountName, sendCurrency,
    receiveCurrency, amount, createTx, navigation, toast,
    addRecent, recipientName, recipientMethod, recipientNetwork,
  ]);

  // Client-side estimate only; the committed `chargeAmount` returns from POST /v1/transactions
  // and becomes source-of-truth on TransactionStatusScreen / TransferDetail.
  const fee = Math.round(amount * 0.015 * 100) / 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="Confirm" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.reviewCard, { backgroundColor: palette.grey[200] }, hairline]}>
          {/* Recipient strip */}
          <View style={styles.recipStrip}>
            <Avatar seed={recipientName} size={34} />
            <View style={styles.rsInfo}>
              <Text style={[styles.rsName, { color: palette.grey[900] }]}>{recipientName}</Text>
              {isCryptoOut ? (
                <Text style={[styles.rsSub, { color: palette.grey[500] }]}>
                  {truncateAddress(recipientWalletAddress || '')} · Solana
                </Text>
              ) : (
                <Text style={[styles.rsSub, { color: palette.grey[500] }]}>
                  {recipientMethod} · {recipientAccountNumber}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.reviewDivider} />

          {/* Amount details */}
          <View style={styles.reviewPad}>
            <View style={styles.swapRow}>
              <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>You send</Text>
              <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
                {sendSymbol}{amount.toLocaleString()} {sendCurrency}
              </Text>
            </View>
            <View style={styles.reviewDivider} />
            <View style={styles.swapRow}>
              <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>They receive</Text>
              <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
                {isCryptoOut
                  ? `${liveReceiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                  : `${recvSymbol}${liveReceiveAmount.toLocaleString()}`}
              </Text>
            </View>
          </View>

          <View style={styles.reviewDivider} />

          {/* Rate + Fee */}
          <View style={[styles.metaRows, styles.reviewPad]}>
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Rate</Text>
              <View style={styles.rateRight}>
                {rateLoading ? (
                  <ActivityIndicator size="small" color={palette.royal[500]} />
                ) : liveRate ? (
                  <Text style={[styles.feeValue, { color: palette.grey[900] }]}>
                    1 {sendCurrency} = {recvSymbol}{liveRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                ) : (
                  <Text style={[styles.feeValue, { color: palette.status.negative }]}>
                    Unavailable
                  </Text>
                )}
              </View>
            </View>

            {/* Freshness pill */}
            <View style={styles.freshRow}>
              <TouchableOpacity
                style={[styles.freshPill, { backgroundColor: palette.grey[100] }, hairline]}
                onPress={refreshRate}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={12} color={palette.grey[400]} />
                <Text style={[styles.freshText, { color: palette.grey[400] }]}>
                  {rateFreshness || 'Refreshing...'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.rateNote, { color: palette.grey[600] }]}>Estimated rate</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Fee (est.)</Text>
              <Text style={[styles.feeValue, { color: palette.grey[900] }]}>
                {sendSymbol}{fee.toLocaleString()} {sendCurrency}
              </Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Delivery</Text>
              <View style={styles.deliveryPill}>
                <Ionicons name="pulse" size={11} color={palette.grey[500]} />
                <Text style={[styles.deliveryText, { color: palette.grey[900] }]}>
                  Live tracking
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={14} color={palette.grey[500]} />
          <Text style={[styles.disclaimerText, { color: palette.grey[500] }]}>
            The final rate and fee are locked when your transaction is created. The amounts above are estimates and may differ slightly.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <CTAButton
            title="Confirm & Send"
            onPress={handleConfirm}
            disabled={rateLoading || !liveRate}
          />
        </View>
      </ScrollView>

      {/* PIN Bottom Sheet */}
      <BottomSheet
        visible={showPin}
        onClose={() => setShowPin(false)}
        title="Enter PIN"
      >
        <View style={styles.pinSheet}>
          <Text style={[styles.pinPrompt, { color: palette.grey[900] }]}>
            Enter your 4-digit PIN to confirm this transfer
          </Text>

          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: pin.length > i ? palette.royal[500] : palette.grey[300],
                    borderColor: pinError ? palette.status.negative : 'transparent',
                    borderWidth: pinError ? 1 : 0,
                  },
                ]}
              />
            ))}
          </View>

          <TextInput
            ref={pinInputRef}
            style={styles.pinHidden}
            value={pin}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 4);
              setPin(digits);
              setPinError('');
            }}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
          />

          {pinError ? (
            <Text style={[styles.pinErrorText, { color: palette.status.negative }]}>
              {pinError}
            </Text>
          ) : null}

          <Text style={[styles.pinDisclaimer, { color: palette.grey[500] }]}>
            I confirm that I want to send {sendSymbol}{amount.toLocaleString()} {sendCurrency} to {recipientName}. The committed rate and fee will be determined by the backend at transaction creation time.
          </Text>

          <CTAButton
            title="Confirm transfer"
            onPress={handlePinSubmit}
            disabled={pin.length !== 4}
            loading={createTx.isPending}
            style={{ marginTop: 16 }}
          />

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowPin(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: palette.grey[400] }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 20 }} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing(6) },
  reviewCard: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(4),
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: palette.material.darkThin,
    width: '100%',
  },
  reviewPad: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
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
  rsSub: { ...typography.secondary12, marginTop: 2 },
  swapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: spacing(1),
  },
  swapLabel: { ...typography.subheader2 },
  swapValue: { ...typography.main14, fontVariant: ['tabular-nums'] },
  metaRows: { gap: spacing(3) },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLabel: { ...typography.subheader2 },
  feeValue: { ...typography.monoSm, fontVariant: ['tabular-nums'] },
  rateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 4,
  },
  freshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  freshText: { ...typography.helperText },
  rateNote: { ...typography.helperText },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: { ...typography.main12, fontVariant: ['tabular-nums'] },
  disclaimerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginHorizontal: spacing(6),
    marginBottom: spacing(4),
  },
  disclaimerText: { flex: 1, ...typography.helperText, lineHeight: 16 },
  ctaWrap: { paddingHorizontal: spacing(6), paddingBottom: spacing(6) },
  pinSheet: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pinPrompt: {
    ...typography.bodySm,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinHidden: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinErrorText: {
    ...typography.bodySm,
    marginBottom: 8,
  },
  pinDisclaimer: {
    ...typography.helperText,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelText: { ...typography.buttonS },
});

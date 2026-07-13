import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, Avatar, CTAButton, BottomSheet } from '../../components';
import { useCalculateQuote } from '../../hooks/useQuote';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import { useRecentRecipientsStore } from '../../store/recentRecipientsStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import type { QuoteResponse } from '../../api/quotes';
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

const formatAmount = (value: number, currency: string): string =>
  currency === 'USDT'
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(value).toLocaleString();

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    amount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
    amountType,
    recipientName,
    recipientMethod,
    recipientWalletAddress,
    recipientNetwork,
    recipientBankCode,
    recipientAccountNumber,
    recipientAccountName,
  } = route.params;

  const hairline = borders.hairline.light;
  const toast = useToast();
  const createTx = useCreateTransaction();
  const quoteMutation = useCalculateQuote();
  const addRecent = useRecentRecipientsStore((s) => s.add);

  const isCryptoOut = receiveCurrency === 'USDT';
  const usdtIsSend = sendCurrency === 'USDT';
  const recvSymbol = currencySymbols[receiveCurrency] || '';
  const sendSymbol = currencySymbols[sendCurrency] || '';

  // The amount to quote reflects what the user actually typed: for RECEIVE the
  // entered figure is the target payout, otherwise it's the base to send.
  const quoteAmount = amountType === 'RECEIVE' ? receiveAmount : amount;

  // ─── Quote state ───
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expired = secondsLeft !== null && secondsLeft <= 0;

  const requestQuote = useCallback(async () => {
    setQuoteError(null);
    setSecondsLeft(null);
    try {
      const q = await quoteMutation.mutateAsync({
        amount: quoteAmount,
        sendCurrency,
        receiveCurrency,
        amountType: amountType ?? 'SEND',
      });
      setQuote(q);
    } catch (error) {
      setQuote(null);
      setQuoteError(getApiErrorMessage(error));
    }
    // quoteMutation is stable across renders; excluded to avoid a re-quote loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteAmount, sendCurrency, receiveCurrency, amountType]);

  useEffect(() => {
    requestQuote();
    // Quote once on mount; re-quotes are explicit (expiry / refresh).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown from the quote's expiry.
  useEffect(() => {
    if (!quote?.expiresAt) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [quote?.expiresAt]);

  // ─── PIN state ───
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

  const saveRecent = useCallback(() => {
    if (isCryptoOut && recipientWalletAddress) {
      addRecent({
        channel: 'wallet',
        label: recipientName,
        data: { walletAddress: recipientWalletAddress, network: recipientNetwork ?? 'SOLANA' },
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
  }, [
    isCryptoOut, recipientWalletAddress, recipientNetwork, recipientName,
    recipientBankCode, recipientAccountNumber, recipientAccountName,
    recipientMethod, addRecent,
  ]);

  const handlePinSubmit = useCallback(async () => {
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    if (!quote || expired) {
      setShowPin(false);
      toast.info('Rate expired. Refreshing your quote.');
      await requestQuote();
      return;
    }

    const recipient: Recipient = isCryptoOut
      ? { walletAddress: recipientWalletAddress, network: recipientNetwork ?? 'SOLANA' }
      : {
          bankCode: recipientBankCode,
          accountNumber: recipientAccountNumber,
          accountName: recipientAccountName,
        };

    try {
      const tx = await createTx.mutateAsync({
        quoteId: quote.quoteId,
        amount: quote.totalToSend,
        recipient,
        pin,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPin(false);
      saveRecent();
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
    pin, quote, expired, isCryptoOut, recipientWalletAddress, recipientNetwork,
    recipientBankCode, recipientAccountNumber, recipientAccountName,
    createTx, navigation, toast, saveRecent, requestQuote,
  ]);

  const quoteLoading = quoteMutation.isPending && !quote;
  const canConfirm = !!quote && !expired && !quoteLoading;

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

          {quoteLoading ? (
            <View style={styles.quoteLoading}>
              <ActivityIndicator size="small" color={palette.royal[500]} />
              <Text style={[styles.quoteLoadingText, { color: palette.grey[500] }]}>
                Locking in your rate…
              </Text>
            </View>
          ) : quote ? (
            <>
              {/* Primary amounts */}
              <View style={styles.reviewPad}>
                <View style={styles.swapRow}>
                  <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>You pay</Text>
                  <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
                    {sendSymbol}{formatAmount(quote.totalToSend, sendCurrency)} {sendCurrency}
                  </Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.swapRow}>
                  <Text style={[styles.swapLabel, { color: palette.grey[500] }]}>They receive</Text>
                  <Text style={[styles.swapValue, { color: palette.grey[900] }]}>
                    {recvSymbol}{formatAmount(quote.receiveAmount, receiveCurrency)} {receiveCurrency}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewDivider} />

              {/* Breakdown */}
              <View style={[styles.metaRows, styles.reviewPad]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Amount</Text>
                  <Text style={[styles.feeValue, { color: palette.grey[900] }]}>
                    {sendSymbol}{formatAmount(quote.enteredAmount, sendCurrency)} {sendCurrency}
                  </Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Fee</Text>
                  <Text style={[styles.feeValue, { color: palette.grey[900] }]}>
                    {sendSymbol}{formatAmount(quote.fee, sendCurrency)} {sendCurrency}
                  </Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: palette.grey[500] }]}>Rate</Text>
                  <Text style={[styles.feeValue, { color: palette.grey[900] }]}>
                    {usdtIsSend
                      ? `1 USDT = ${recvSymbol}${quote.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : `1 USDT = ${sendSymbol}${(1 / quote.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
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
            </>
          ) : (
            <View style={styles.quoteLoading}>
              <Ionicons name="alert-circle-outline" size={22} color={palette.status.negative} />
              <Text style={[styles.quoteErrorText, { color: palette.grey[900] }]}>
                {quoteError || 'Could not load a quote'}
              </Text>
              <TouchableOpacity onPress={requestQuote} activeOpacity={0.7} style={styles.retryBtn}>
                <Ionicons name="refresh" size={14} color={palette.royal[500]} />
                <Text style={[styles.retryText, { color: palette.royal[500] }]}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Countdown / expiry */}
        {quote ? (
          expired ? (
            <TouchableOpacity
              style={[styles.expiryRow, { backgroundColor: palette.grey[200] }, hairline]}
              onPress={requestQuote}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={14} color={palette.status.negative} />
              <Text style={[styles.expiryText, { color: palette.status.negative }]}>
                Rate expired — tap to refresh
              </Text>
            </TouchableOpacity>
          ) : secondsLeft !== null ? (
            <View style={styles.countdownRow}>
              <Ionicons name="time-outline" size={13} color={palette.grey[500]} />
              <Text style={[styles.countdownText, { color: palette.grey[500] }]}>
                Rate locked · expires in {formatCountdown(secondsLeft)}
              </Text>
            </View>
          ) : null
        ) : null}

        {/* Disclaimer */}
        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={14} color={palette.grey[500]} />
          <Text style={[styles.disclaimerText, { color: palette.grey[500] }]}>
            The rate and fee shown are locked to this quote. If it expires before you confirm, we'll fetch a fresh quote automatically.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          {expired ? (
            <CTAButton
              title="Refresh rate"
              onPress={requestQuote}
              loading={quoteMutation.isPending}
            />
          ) : (
            <CTAButton
              title="Confirm & Send"
              onPress={handleConfirm}
              disabled={!canConfirm}
              loading={quoteLoading}
            />
          )}
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

          <Pressable
            style={styles.pinInputWrap}
            onPress={() => pinInputRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="Enter PIN"
          >
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
              style={styles.pinOverlayInput}
              value={pin}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '').slice(0, 4);
                setPin(digits);
                setPinError('');
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              caretHidden
              textContentType="oneTimeCode"
            />
          </Pressable>

          {pinError ? (
            <Text style={[styles.pinErrorText, { color: palette.status.negative }]}>
              {pinError}
            </Text>
          ) : null}

          <Text style={[styles.pinDisclaimer, { color: palette.grey[500] }]}>
            {quote
              ? `I confirm I want to pay ${sendSymbol}${formatAmount(quote.totalToSend, sendCurrency)} ${sendCurrency} to send ${recvSymbol}${formatAmount(quote.receiveAmount, receiveCurrency)} ${receiveCurrency} to ${recipientName}.`
              : `I confirm I want to send to ${recipientName}.`}
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
    marginBottom: spacing(3),
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
  quoteLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing(8),
  },
  quoteLoadingText: { ...typography.bodySm },
  quoteErrorText: { ...typography.bodySm, textAlign: 'center', paddingHorizontal: spacing(6) },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  retryText: { ...typography.buttonS },
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
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: { ...typography.main12, fontVariant: ['tabular-nums'] },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing(6),
    marginBottom: spacing(4),
  },
  countdownText: { ...typography.helperText, fontVariant: ['tabular-nums'] },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing(6),
    marginBottom: spacing(4),
    paddingVertical: spacing(3),
    borderRadius: radii.md,
  },
  expiryText: { ...typography.main12 },
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
  pinInputWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinOverlayInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    textAlign: 'center',
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

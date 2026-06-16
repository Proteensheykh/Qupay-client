import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import { CTAButton, BottomSheet } from '../../components';
import { useTransaction, useConfirmTransfer } from '../../hooks/useTransactions';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import { isTerminalStatus } from '../../utils/transactionStatus';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import type { TransactionStatus } from '../../types/transaction';
import { typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';

type Props = NativeStackScreenProps<SendFlowParamList, 'TransactionStatus'>;

const STATUS_CONFIG: Record<TransactionStatus, {
  icon: string;
  title: string;
  subtitle: (tx: any) => string;
  color: string;
}> = {
  QUEUED: {
    icon: 'radio-outline',
    title: 'Finding a marketplace participant\u2026',
    subtitle: () => 'Your transaction is in the queue. An MP will accept it shortly.',
    color: palette.royal[500],
  },
  IN_PROGRESS: {
    icon: 'wallet-outline',
    title: 'Send your funds',
    subtitle: (tx) => `An MP has accepted your transaction. Send ${tx?.originalAmount ?? ''} ${tx?.fromCurrency ?? ''} to the address below.`,
    color: palette.royal[500],
  },
  PAYER_PAID: {
    icon: 'time-outline',
    title: 'Waiting for MP to release funds',
    subtitle: () => 'You\'ve confirmed payment. The MP is now processing your transfer.',
    color: palette.status.partial,
  },
  COMPLETE: {
    icon: 'checkmark-circle',
    title: 'Transfer complete!',
    subtitle: (tx) => `${tx?.convertedAmount?.toLocaleString() ?? ''} ${tx?.toCurrency ?? ''} has been delivered.`,
    color: palette.status.positive,
  },
  CANCELLED: {
    icon: 'close-circle',
    title: 'Transaction cancelled',
    subtitle: () => 'The confirmation deadline passed without payment confirmation.',
    color: palette.status.negative,
  },
  EXPIRED: {
    icon: 'hourglass-outline',
    title: 'Transaction expired',
    subtitle: () => 'No marketplace participant accepted within 24 hours.',
    color: palette.status.negative,
  },
  DISPUTED: {
    icon: 'warning-outline',
    title: 'Transaction disputed',
    subtitle: () => 'This transaction is under review. Please contact support.',
    color: palette.status.negative,
  },
};

function formatCountdown(deadline: string): string {
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return '0:00';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const TransactionStatusScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId, origin = 'send' } = route.params;
  const { data: tx, refetch, isLoading, error } = useTransaction(transactionId);
  const confirmTransfer = useConfirmTransfer();
  const toast = useToast();

  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [countdown, setCountdown] = useState('');
  const appState = useRef(AppState.currentState);

  const status: TransactionStatus | null = tx?.status ?? null;
  const config = status ? STATUS_CONFIG[status] : null;
  const isTerminal = status ? isTerminalStatus(status) : false;

  // Countdown timer
  useEffect(() => {
    const deadline = status === 'QUEUED'
      ? tx?.expiresAt
      : status === 'IN_PROGRESS'
        ? tx?.payerConfirmationDeadline
        : null;

    if (!deadline) {
      setCountdown('');
      return;
    }

    const update = () => setCountdown(formatCountdown(deadline));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status, tx?.expiresAt, tx?.payerConfirmationDeadline]);

  // Foreground/background handling — refetch on foreground return
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refetch();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [refetch]);

  useEffect(() => {
    if (status === 'COMPLETE') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status]);

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [error, toast]);

  const handleConfirmTransfer = useCallback(async () => {
    try {
      await confirmTransfer.mutateAsync(transactionId);
      setShowConfirmSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Payment confirmed');
    } catch (error) {
      const msg = getApiErrorMessage(error);
      toast.error(msg);
      setShowConfirmSheet(false);
    }
  }, [transactionId, confirmTransfer, toast]);

  const handleViewReceipt = useCallback(() => {
    if (origin === 'history') {
      // Reached from the History tab: swap this screen for the receipt in-place.
      (navigation as any).replace('TransferDetail', { transactionId });
      return;
    }
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Amount' }] })
    );
    const tabNav = navigation.getParent();
    if (tabNav) {
      tabNav.navigate('HistoryTab', {
        screen: 'TransferDetail',
        params: { transactionId },
      });
    }
  }, [navigation, transactionId, origin]);

  const handleClose = useCallback(() => {
    if (origin === 'history') {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Amount' }] })
    );
  }, [navigation, origin]);

  // Pulse animation state
  const [pulseOn, setPulseOn] = useState(true);
  useEffect(() => {
    if (isTerminal) return;
    const interval = setInterval(() => setPulseOn((p) => !p), 800);
    return () => clearInterval(interval);
  }, [isTerminal]);

  const ringColor = isTerminal
    ? (status === 'COMPLETE' ? palette.status.positive : palette.status.negative)
    : (config?.color ?? palette.royal[500]);

  if (isLoading || !tx || !status || !config) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.royal[500]} />
          <Text style={[styles.loadingText, { color: palette.grey[500] }]}>Loading transaction…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Radar / Status indicator */}
        <View style={styles.radarWrap}>
          <View
            style={[
              styles.radarRing3,
              { borderColor: ringColor, opacity: pulseOn ? 0.25 : 0.12 },
            ]}
          />
          <View
            style={[
              styles.radarRing2,
              { borderColor: ringColor, opacity: pulseOn ? 0.35 : 0.18 },
            ]}
          />
          <View
            style={[
              styles.radarRing1,
              { borderColor: ringColor, opacity: pulseOn ? 0.5 : 0.28 },
            ]}
          />
          <View
            style={[
              styles.radarCenter,
              {
                backgroundColor: isTerminal
                  ? (status === 'COMPLETE' ? 'rgba(122,232,112,0.12)' : 'rgba(255,77,91,0.12)')
                  : palette.grey[800],
                borderWidth: isTerminal ? 0 : 1,
                borderColor: isTerminal ? 'transparent' : palette.material.lightThin,
              },
            ]}
          >
            <Ionicons name={config.icon as any} size={32} color={ringColor} />
          </View>
        </View>

        {/* Title + subtitle */}
        <Text style={[styles.statusTitle, { color: palette.grey[300] }]}>
          {config.title}
        </Text>
        <Text style={[styles.statusSub, { color: palette.grey[500] }]}>
          {config.subtitle(tx)}
        </Text>

        {/* Countdown */}
        {countdown && !isTerminal ? (
          <View style={[styles.countdownPill, { backgroundColor: palette.grey[800] }]}>
            <Ionicons name="time-outline" size={14} color={palette.grey[400]} />
            <Text style={[styles.countdownText, { color: palette.grey[300] }]}>
              {countdown} remaining
            </Text>
          </View>
        ) : null}

        {/* MP Payment Details card (IN_PROGRESS state) */}
        {status === 'IN_PROGRESS' && tx?.mpPaymentDetails ? (
          <View style={[styles.detailCard, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]}>
            <View style={styles.detailHeader}>
              <Ionicons name="wallet-outline" size={18} color={palette.royal[500]} />
              <Text style={[styles.detailHeaderText, { color: palette.grey[300] }]}>
                Send to this {tx.fromCurrency === 'USDT' ? 'wallet' : 'account'}
              </Text>
            </View>

            {tx.fromCurrency === 'USDT' && tx.mpPaymentDetails.walletAddress ? (
              <View style={styles.detailBody}>
                <Text style={[styles.detailLabel, { color: palette.grey[500] }]}>Solana wallet</Text>
                <Text style={[styles.detailMono, { color: palette.grey[300] }]} selectable>
                  {tx.mpPaymentDetails.walletAddress}
                </Text>
              </View>
            ) : null}

            {tx.fromCurrency === 'NGN' && tx.mpPaymentDetails.bankCode ? (
              <View style={styles.detailBody}>
                <Text style={[styles.detailLabel, { color: palette.grey[500] }]}>Bank account</Text>
                <Text style={[styles.detailValue, { color: palette.grey[300] }]}>
                  {tx.mpPaymentDetails.accountName}
                </Text>
                <Text style={[styles.detailMono, { color: palette.grey[400] }]}>
                  {tx.mpPaymentDetails.accountNumber} · {tx.mpPaymentDetails.bankCode}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailAmountRow}>
              <Text style={[styles.detailLabel, { color: palette.grey[500] }]}>Amount to send</Text>
              <Text style={[styles.detailAmount, { color: palette.grey[100] }]}>
                {tx.originalAmount?.toLocaleString()} {tx.fromCurrency}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Transaction summary */}
        {tx ? (
          <View style={[styles.summaryCard, { backgroundColor: palette.grey[800] }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.grey[500] }]}>Amount</Text>
              <Text style={[styles.summaryValue, { color: palette.grey[300] }]}>
                {tx.originalAmount?.toLocaleString()} {tx.fromCurrency} → {tx.convertedAmount?.toLocaleString()} {tx.toCurrency}
              </Text>
            </View>
            {tx.fxRate ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: palette.grey[500] }]}>Rate</Text>
                <Text style={[styles.summaryValue, { color: palette.grey[300] }]}>
                  1 {tx.fromCurrency} = {tx.fxRate.toLocaleString()} {tx.toCurrency}
                </Text>
              </View>
            ) : null}
            {tx.chargeAmount ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: palette.grey[500] }]}>Fee</Text>
                <Text style={[styles.summaryValue, { color: palette.grey[300] }]}>
                  {tx.chargeAmount} {tx.fromCurrency}
                </Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.grey[500] }]}>Code</Text>
              <Text style={[styles.summaryValue, { color: palette.grey[300] }]}>
                {tx.transactionCode}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.ctaWrap}>
          {status === 'IN_PROGRESS' ? (
            <CTAButton
              title="I've sent the funds"
              onPress={() => setShowConfirmSheet(true)}
            />
          ) : status === 'COMPLETE' ? (
            <CTAButton title="View receipt" onPress={handleViewReceipt} />
          ) : isTerminal ? (
            <CTAButton title="Close" onPress={handleClose} />
          ) : null}
        </View>
      </ScrollView>

      {/* Confirmation Bottom Sheet */}
      <BottomSheet
        visible={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        title="Confirm transfer"
      >
        <View style={styles.confirmSheet}>
          <Ionicons name="warning-outline" size={32} color={palette.status.partial} />
          <Text style={[styles.confirmText, { color: palette.grey[300] }]}>
            I confirm that I have sent the funds shown above. Submitting a false confirmation may result in account suspension.
          </Text>
          <CTAButton
            title="Confirm transfer"
            onPress={handleConfirmTransfer}
            loading={confirmTransfer.isPending}
            style={{ marginTop: 16 }}
          />
          <TouchableOpacity
            style={styles.confirmCancel}
            onPress={() => setShowConfirmSheet(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.confirmCancelText, { color: palette.grey[400] }]}>Cancel</Text>
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
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.bodySm,
  },
  radarWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  radarRing3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  radarRing2: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
  },
  radarRing1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
  },
  radarCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSub: {
    ...typography.bodySm,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    marginBottom: 24,
  },
  countdownText: {
    ...typography.monoSm,
    fontVariant: ['tabular-nums'],
  },
  detailCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailHeaderText: { ...typography.h4 },
  detailBody: { marginBottom: 12 },
  detailLabel: { ...typography.label, marginBottom: 4 },
  detailMono: { ...typography.monoSm, lineHeight: 20 },
  detailValue: { ...typography.main14 },
  detailAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.material.lightThin,
  },
  detailAmount: {
    ...typography.h4,
    fontVariant: ['tabular-nums'],
  },
  summaryCard: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryLabel: { ...typography.subheader2 },
  summaryValue: { ...typography.monoSm, fontVariant: ['tabular-nums'] },
  ctaWrap: { alignSelf: 'stretch' },
  confirmSheet: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmText: {
    ...typography.bodySm,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  confirmCancel: {
    marginTop: 12,
    paddingVertical: 12,
  },
  confirmCancelText: { ...typography.buttonS },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { StatusBadge } from '../../components';
import { useToast } from '../../hooks/useToast';
import { useTransaction } from '../../hooks/useTransactions';
import { useBanks } from '../../hooks/useBanks';
import { findBankName } from '../../api/banks';
import { toStatusGroup } from '../../utils/transactionStatus';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import type { TransactionStatus } from '../../types/transaction';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme/typography';
import { runWithoutPinLock } from '../../store/pinLockGuard';

type Props = NativeStackScreenProps<HistoryStackParamList, 'TransferDetail'>;

function statusBadgeVariant(status: TransactionStatus): 'success' | 'warning' | 'error' {
  const group = toStatusGroup(status);
  if (group === 'COMPLETED') return 'success';
  if (group === 'FAILED') return 'error';
  return 'warning';
}

function statusLabel(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETE': return 'Delivered';
    case 'QUEUED': return 'Queued';
    case 'IN_PROGRESS': return 'In Progress';
    case 'PAYER_PAID': return 'Awaiting Completion';
    case 'CANCELLED': return 'Cancelled';
    case 'EXPIRED': return 'Expired';
    case 'DISPUTED': return 'Disputed';
    default: return status;
  }
}

function formatCurrency(amount: number | undefined | null, currency: string): string {
  if (amount == null) return `— ${currency}`;
  if (currency === 'NGN') return `\u20A6${amount.toLocaleString()}`;
  return `${amount.toLocaleString()} ${currency}`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const hairline = {
  borderBottomColor: palette.material.darkThin,
  borderBottomWidth: StyleSheet.hairlineWidth,
};

const Row: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}> = ({ label, value, mono, emphasis }) => (
  <View style={[styles.row, hairline]}>
    <Text style={[styles.rowLabel, { color: palette.grey[500] }]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        { color: palette.grey[900] },
        mono && styles.rowValueMono,
        emphasis && { color: palette.royal[400] },
      ]}
      selectable={mono}
    >
      {value}
    </Text>
  </View>
);

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId } = route.params;
  const { data: tx, isLoading } = useTransaction(transactionId);
  const { data: banks } = useBanks();
  const toast = useToast();

  const goBack = () => navigation.goBack();

  const backdrop = palette.grey[100];
  const cardSurface = palette.grey[200];

  if (isLoading || !tx) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top', 'bottom']}>
        <View style={styles.headerBar}>
          <View style={styles.iconBtn} />
          <Text style={[styles.headerTitle, { color: palette.grey[900] }]}>Receipt</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={goBack} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={palette.grey[900]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={palette.royal[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const recipientName =
    tx.recipient?.accountName ||
    (tx.recipient?.walletAddress
      ? `${tx.recipient.walletAddress.slice(0, 6)}...${tx.recipient.walletAddress.slice(-4)}`
      : tx.transactionCode);

  const isWallet = !!tx.recipient?.walletAddress && !tx.recipient?.accountNumber;
  const bankName = findBankName(banks, tx.recipient?.bankCode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <View style={styles.iconBtn} />
        <Text style={[styles.headerTitle, { color: palette.grey[900] }]}>Receipt</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={palette.grey[900]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <Text style={styles.heroAmount}>
            {formatCurrency(tx.convertedAmount, tx.toCurrency)}
          </Text>
          <View style={styles.heroBadgeWrap}>
            <StatusBadge label={statusLabel(tx.status)} variant={statusBadgeVariant(tx.status)} />
          </View>
          <Text style={[styles.heroSub, { color: palette.grey[500] }]}>to {recipientName}</Text>
        </View>

        {/* Transaction details */}
        <View
          style={[
            styles.detailCard,
            { backgroundColor: cardSurface },
            borders.hairline.light,
            { borderRadius: radii.lg },
          ]}
        >
          <Row label="You sent" value={formatCurrency(tx.originalAmount, tx.fromCurrency)} />
          {tx.chargeAmount > 0 && (
            <Row label="Fee" value={formatCurrency(tx.chargeAmount, tx.fromCurrency)} />
          )}
          {tx.totalToSend != null && (
            <Row label="Total paid" value={formatCurrency(tx.totalToSend, tx.fromCurrency)} />
          )}
          <Row label="They receive" value={formatCurrency(tx.convertedAmount, tx.toCurrency)} emphasis />
          <Row label="Rate" value={`1 ${tx.fromCurrency} = ${tx.fxRate?.toLocaleString() ?? '—'} ${tx.toCurrency}`} />
          <Row label="Created" value={formatDate(tx.createdAt)} />
          {tx.status === 'COMPLETE' && (tx.completedAt || tx.expiresAt) && (
            <Row label="Completed" value={formatDate(tx.completedAt ?? tx.expiresAt)} />
          )}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              Clipboard.setStringAsync(tx.transactionCode);
              toast.info('Reference copied to clipboard.');
            }}
          >
            <Row label="Reference" value={tx.transactionCode} mono />
          </TouchableOpacity>
        </View>

        {/* Recipient details */}
        <View
          style={[
            styles.detailCard,
            { backgroundColor: cardSurface },
            borders.hairline.light,
            { borderRadius: radii.lg },
            { marginTop: 12 },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={palette.royal[400]} />
            <Text style={[styles.sectionTitle, { color: palette.grey[400] }]}>Recipient</Text>
          </View>
          {tx.recipient?.accountName && (
            <Row label="Name" value={tx.recipient.accountName} />
          )}
          {tx.recipient?.accountNumber && (
            <Row label="Account" value={tx.recipient.accountNumber} />
          )}
          {tx.recipient?.bankCode && (
            <Row label="Bank" value={bankName ?? tx.recipient.bankCode} />
          )}
          {tx.recipient?.walletAddress && (
            <Row label="Wallet" value={tx.recipient.walletAddress} mono />
          )}
        </View>

        {/* Proof section */}
        {tx.proof?.proofUrl && (
          <View
            style={[
              styles.detailCard,
              { backgroundColor: cardSurface },
              borders.hairline.light,
              { borderRadius: radii.lg },
              { marginTop: 12 },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-attach-outline" size={16} color={palette.status.positive} />
              <Text style={[styles.sectionTitle, { color: palette.grey[400] }]}>Proof of Payment</Text>
            </View>
            {tx.proof?.contentType && (
              <Row label="Type" value={tx.proof.contentType} />
            )}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={async () => {
                await Clipboard.setStringAsync(tx.proof!.proofUrl);
                toast.info('Proof URL copied to clipboard.');
                try {
                  // Opening the URL backgrounds the app; suppress the
                  // foreground PIN lock so returning doesn't force re-verify.
                  await runWithoutPinLock(() => Linking.openURL(tx.proof!.proofUrl));
                } catch {
                  // Ignore if device/browser cannot open the URL.
                }
              }}
            >
              <Row label="URL" value={tx.proof.proofUrl} mono />
            </TouchableOpacity>
            {tx.proof?.description && (
              <Row label="Note" value={tx.proof.description} />
            )}
            {tx.proof?.uploadedAt && (
              <Row label="Uploaded" value={formatDate(tx.proof.uploadedAt)} />
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: palette.material.darkThin }]}>
        <TouchableOpacity
          style={[styles.ctaSecondary, { backgroundColor: palette.grey[200] }, borders.hairline.light]}
          onPress={goBack}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaSecondaryText, { color: palette.grey[900] }]}>Back to history</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    ...typography.h5,
  },
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
  heroBadgeWrap: { marginTop: 12 },
  heroAmount: {
    ...typography.valueLg,
    color: palette.grey[900],
  },
  heroSub: {
    ...typography.bodySm,
    marginTop: 10,
  },
  detailCard: {
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    ...typography.label,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowLabel: {
    ...typography.bodySm,
  },
  rowValue: {
    ...typography.bodySm,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  rowValueMono: {
    ...typography.mono,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaSecondary: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    ...typography.buttonS,
  },
});

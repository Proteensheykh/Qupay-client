import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { Avatar, ScreenHeader, usePullToRefresh, EmptyState } from '../../components';
import { useMyTransactions } from '../../hooks/useTransactions';
import { toStatusGroup, isTerminalStatus } from '../../utils/transactionStatus';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import type { TransactionListItem, TransactionStatus } from '../../types/transaction';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<HistoryStackParamList, 'History'>;

function statusDot(status: TransactionStatus) {
  const group = toStatusGroup(status);
  switch (group) {
    case 'COMPLETED':
      return { bg: palette.status.positive, icon: '\u2713' };
    case 'FAILED':
      return { bg: palette.status.negative, icon: '\u2717' };
    case 'PENDING':
    case 'IN_PROGRESS':
    default:
      return { bg: palette.status.partial, icon: '\u2026' };
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'NGN') return `\u20A6${amount.toLocaleString()}`;
  if (currency === 'USDT') return `${amount.toLocaleString()} USDT`;
  return `${amount.toLocaleString()} ${currency}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { data: transactions, isLoading, refetch } = useMyTransactions();
  const { refreshControl } = usePullToRefresh(useCallback(() => refetch().then(() => {}), [refetch]));

  const backdrop = palette.grey[100];
  const hairline = palette.material.darkThin;

  const renderItem = (item: TransactionListItem) => {
    const dot = statusDot(item.status);
    const group = toStatusGroup(item.status);
    const recipientLabel = `${item.fromCurrency} \u2192 ${item.toCurrency}`;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.row, { borderBottomColor: hairline }]}
        onPress={() =>
          isTerminalStatus(item.status)
            ? navigation.navigate('TransferDetail', { transactionId: item.id })
            : navigation.navigate('TransactionStatus', {
                transactionId: item.id,
                origin: 'history',
              })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avWrap}>
          <Avatar seed={item.transactionCode} size={44} />
          <View style={[styles.statusDot, { backgroundColor: dot.bg, borderColor: backdrop }]}>
            <Text style={[styles.statusDotText, { color: palette.grey[900] }]}>{dot.icon}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: palette.grey[900] }]}>{item.transactionCode}</Text>
          <Text style={[styles.detail, { color: palette.grey[500] }]}>
            {recipientLabel} {'\u00B7'} {timeAgo(item.createdAt)}
          </Text>
        </View>
        <View style={styles.amtCol}>
          <Text
            style={[
              styles.receiveAmt,
              { color: palette.grey[900] },
              group === 'FAILED' && { color: palette.status.negative },
            ]}
          >
            {group === 'FAILED'
              ? `\u21A9 ${formatCurrency(item.originalAmount, item.fromCurrency)}`
              : formatCurrency(item.convertedAmount, item.toCurrency)}
          </Text>
          <Text style={[styles.sentLabel, { color: palette.grey[500] }]}>
            {formatCurrency(item.originalAmount, item.fromCurrency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top']}>
      <ScreenHeader title="History" />

      {isLoading && !transactions ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={palette.royal[500]} />
        </View>
      ) : !transactions?.length ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={refreshControl}
        >
          <EmptyState
            emoji="\u{1F4E8}"
            title="No transfers yet"
            subtitle="Your transfer history will appear here once you send your first payment."
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <View style={styles.countWrap}>
            <Text style={[styles.countText, { color: palette.grey[500] }]}>
              {transactions.length} transfer{transactions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {transactions.map(renderItem)}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
  },
  countText: {
    ...typography.subheader2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avWrap: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
  },
  info: { flex: 1 },
  name: {
    ...typography.bodySmMedium,
  },
  detail: {
    ...typography.labelSm,
    marginTop: 2,
    textTransform: 'none',
    letterSpacing: 0,
  },
  amtCol: { alignItems: 'flex-end' },
  receiveAmt: {
    ...typography.bodySmMedium,
  },
  sentLabel: {
    ...typography.monoXs,
    marginTop: 1,
  },
});

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader, StatusBadge } from '../../components';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import type { TransactionStatus, TransactionDetail } from '../../types/transaction';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { borders } from '../../theme/elevation';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'TransactionStream'>;

type TabType = 'stream' | 'in_progress' | 'completed';

const currencySymbols: Record<string, string> = {
  USDT: '',
  NGN: '\u20A6',
  GHS: '\u20B5',
  KES: 'KSh',
  INR: '\u20B9',
  PHP: '\u20B1',
  MXN: '$',
  PKR: 'Rs',
  ZAR: 'R',
};

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'stream', label: 'Stream', icon: 'flash-outline' },
  { key: 'in_progress', label: 'In Progress', icon: 'hourglass-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
];

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function statusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    PENDING_DEPOSIT: 'Pending',
    DEPOSIT_CONFIRMED: 'Ready',
    MATCHED: 'Matched',
    SETTLEMENT_IN_PROGRESS: 'Settling',
    SETTLEMENT_PROOF_UPLOADED: 'Proof Sent',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    EXPIRED: 'Expired',
    DISPUTED: 'Disputed',
  };
  return labels[status];
}

function statusBadgeVariant(
  status: TransactionStatus
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
    case 'EXPIRED':
      return 'error';
    case 'PENDING_DEPOSIT':
    case 'SETTLEMENT_IN_PROGRESS':
    case 'DISPUTED':
      return 'warning';
    case 'DEPOSIT_CONFIRMED':
    case 'MATCHED':
    case 'SETTLEMENT_PROOF_UPLOADED':
      return 'info';
    default:
      return 'neutral';
  }
}

export const TransactionStreamScreen: React.FC<Props> = ({ navigation }) => {
  const backdrop = palette.grey[900];
  const hairline = palette.material.lightThin;
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const transactions = useTransactionStore((state) => state.transactions);
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const isSearching = searchQuery.trim().length > 0;

  const allProcessorTransactions = useMemo(() => {
    return transactions.filter(
      (tx) =>
        (tx.status === 'DEPOSIT_CONFIRMED' && !tx.processorId) ||
        (['MATCHED', 'SETTLEMENT_IN_PROGRESS', 'SETTLEMENT_PROOF_UPLOADED', 'COMPLETED'].includes(tx.status) &&
          tx.processorId === currentUserId)
    );
  }, [transactions, currentUserId]);

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const query = searchQuery.trim().toUpperCase();
    return allProcessorTransactions
      .filter(
        (tx) =>
          tx.slug.toUpperCase().includes(query) ||
          tx.id.toUpperCase().includes(query)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searchQuery, allProcessorTransactions, isSearching]);

  const filteredTransactions = useMemo(() => {
    let filtered: TransactionDetail[] = [];

    switch (activeTab) {
      case 'stream':
        filtered = transactions.filter(
          (tx) => tx.status === 'DEPOSIT_CONFIRMED' && !tx.processorId
        );
        break;
      case 'in_progress':
        filtered = transactions.filter(
          (tx) =>
            ['MATCHED', 'SETTLEMENT_IN_PROGRESS', 'SETTLEMENT_PROOF_UPLOADED'].includes(tx.status) &&
            tx.processorId === currentUserId
        );
        break;
      case 'completed':
        filtered = transactions.filter(
          (tx) => tx.status === 'COMPLETED' && tx.processorId === currentUserId
        );
        break;
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions, activeTab, currentUserId]);

  const displayTransactions = isSearching ? searchResults : filteredTransactions;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleTransactionPress = (transactionId: string, slug: string) => {
    navigation.navigate('ProcessorTransactionDetail', { transactionId, slug });
  };

  const renderItem = ({ item }: { item: TransactionDetail }) => {
    const recvSymbol = currencySymbols[item.receiveCurrency] || '';
    const amountLine = `${item.sendAmount} ${item.sendCurrency} \u2192 ${recvSymbol}${item.receiveAmount.toLocaleString()} ${item.receiveCurrency}`;

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: hairline }]}
        onPress={() => handleTransactionPress(item.id, item.slug)}
        activeOpacity={0.7}
      >
        <View style={styles.rowMain}>
          <Text style={[styles.amountLine, { color: palette.grey[300] }]} numberOfLines={2}>
            {amountLine}
          </Text>
          <Text style={[styles.slugText, { color: palette.grey[500] }]} numberOfLines={1}>
            {item.slug}
          </Text>
        </View>
        <View style={styles.rowMeta}>
          <StatusBadge label={statusLabel(item.status)} variant={statusBadgeVariant(item.status)} />
          <Text style={[styles.timeText, { color: palette.grey[500] }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.grey[600]} />
      </TouchableOpacity>
    );
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'stream':
        return {
          title: 'No open transactions',
          sub: 'Transactions ready for settlement will appear here. Pull down to refresh.',
        };
      case 'in_progress':
        return {
          title: 'No active transactions',
          sub: 'Transactions you accept will appear here while you settle them.',
        };
      case 'completed':
        return {
          title: 'No completed transactions',
          sub: 'Transactions you have successfully settled will appear here.',
        };
    }
  };

  const tabCounts = useMemo(() => ({
    stream: transactions.filter(
      (tx) => tx.status === 'DEPOSIT_CONFIRMED' && !tx.processorId
    ).length,
    in_progress: transactions.filter(
      (tx) =>
        ['MATCHED', 'SETTLEMENT_IN_PROGRESS', 'SETTLEMENT_PROOF_UPLOADED'].includes(tx.status) &&
        tx.processorId === currentUserId
    ).length,
    completed: transactions.filter(
      (tx) => tx.status === 'COMPLETED' && tx.processorId === currentUserId
    ).length,
  }), [transactions, currentUserId]);

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.grey[800] }]}>
            <Ionicons name="search-outline" size={36} color={palette.grey[600]} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.grey[300] }]}>No results</Text>
          <Text style={[styles.emptySub, { color: palette.grey[500] }]}>
            No transactions found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    const { title, sub } = getEmptyMessage();
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: palette.grey[800] }]}>
          <Ionicons name="swap-horizontal-outline" size={36} color={palette.grey[600]} />
        </View>
        <Text style={[styles.emptyTitle, { color: palette.grey[300] }]}>{title}</Text>
        <Text style={[styles.emptySub, { color: palette.grey[500] }]}>{sub}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top']}>
      <ScreenHeader title="Processor" />

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: palette.grey[800],
              borderColor: searchFocused ? `${palette.royal[500]}66` : hairline,
            },
            borders.hairline.dark,
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={searchFocused ? palette.royal[500] : palette.grey[600]}
          />
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, { color: palette.grey[300] }]}
            placeholder="Search by slug or ID (e.g. QP-X7K2M9)"
            placeholderTextColor={palette.grey[600]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                searchRef.current?.blur();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={palette.grey[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearching && (
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: palette.grey[800],
                    borderColor: hairline,
                  },
                  borders.hairline.dark,
                  isActive && {
                    backgroundColor: `${palette.royal[500]}1A`,
                    borderColor: `${palette.royal[500]}4D`,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? palette.royal[500] : palette.grey[500]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: palette.grey[500] },
                    isActive && { color: palette.royal[500], fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: 'rgba(251,251,253,0.10)' },
                      isActive && { backgroundColor: `${palette.royal[500]}33` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: palette.grey[500] },
                        isActive && { color: palette.royal[500] },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {displayTransactions.length > 0 && (
        <Text style={[styles.countText, { color: palette.grey[500] }]}>
          {isSearching ? `${displayTransactions.length} result${displayTransactions.length !== 1 ? 's' : ''}` : `${displayTransactions.length} transaction${displayTransactions.length !== 1 ? 's' : ''}`}
        </Text>
      )}

      <FlatList
        data={displayTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          displayTransactions.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.royal[500]}
            colors={[palette.royal[500]]}
            progressBackgroundColor={palette.grey[800]}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    paddingVertical: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  countText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  slugText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  amountLine: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

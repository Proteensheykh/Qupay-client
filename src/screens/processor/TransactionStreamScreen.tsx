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
import { ScreenHeader } from '../../components';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import type { TransactionStatus, TransactionDetail } from '../../types/transaction';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

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

const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
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

export const TransactionStreamScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const transactions = useTransactionStore((state) => state.transactions);
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const statusConfig = useMemo(
    (): Record<
      TransactionStatus,
      { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }
    > => ({
      PENDING_DEPOSIT: {
        label: 'Pending',
        color: theme.warning.main,
        bgColor: theme.warning.bg,
        icon: 'time-outline',
      },
      DEPOSIT_CONFIRMED: {
        label: 'Ready',
        color: theme.secondary.main,
        bgColor: theme.info.bg,
        icon: 'checkmark-circle-outline',
      },
      MATCHED: {
        label: 'Matched',
        color: theme.info.main,
        bgColor: theme.info.bg,
        icon: 'link-outline',
      },
      SETTLEMENT_IN_PROGRESS: {
        label: 'Settling',
        color: theme.warning.main,
        bgColor: theme.warning.bg,
        icon: 'hourglass-outline',
      },
      SETTLEMENT_PROOF_UPLOADED: {
        label: 'Proof Sent',
        color: theme.secondary.main,
        bgColor: theme.info.bg,
        icon: 'document-attach-outline',
      },
      COMPLETED: {
        label: 'Completed',
        color: theme.success.main,
        bgColor: theme.success.bg,
        icon: 'checkmark-done-outline',
      },
      FAILED: {
        label: 'Failed',
        color: theme.error.main,
        bgColor: theme.error.bg,
        icon: 'close-circle-outline',
      },
      EXPIRED: {
        label: 'Expired',
        color: theme.error.light,
        bgColor: theme.error.bg,
        icon: 'timer-outline',
      },
      DISPUTED: {
        label: 'Disputed',
        color: theme.warning.main,
        bgColor: theme.warning.bg,
        icon: 'warning-outline',
      },
    }),
    [theme]
  );

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
    const status = statusConfig[item.status];
    const recvSymbol = currencySymbols[item.receiveCurrency] || '';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.background.paper, borderColor: theme.inputBorder }]}
        onPress={() => handleTransactionPress(item.id, item.slug)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.slugBadge,
              {
                backgroundColor: `${theme.secondary.main}1A`,
                borderColor: `${theme.secondary.main}33`,
              },
            ]}
          >
            <Text style={[styles.slugText, { color: theme.secondary.main }]}>{item.slug}</Text>
          </View>
          <Text style={[styles.timeText, { color: theme.text.secondary }]}>{timeAgo(item.createdAt)}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.amountRow}>
            <Text style={[styles.sendAmount, { color: theme.text.primary }]}>
              {item.sendAmount} {item.sendCurrency}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={theme.text.muted} />
            <Text style={[styles.receiveAmount, { color: theme.secondary.main }]}>
              {recvSymbol}
              {item.receiveAmount.toLocaleString()} {item.receiveCurrency}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.corridorText, { color: theme.text.secondary }]}>{item.corridorDisplay}</Text>
            <Text style={{ color: theme.text.muted }}>{'\u00B7'}</Text>
            <Text style={[styles.methodText, { color: theme.text.secondary }]}>{item.recipientAccountLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.text.disabled} />
        </View>
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
          <View style={[styles.emptyIcon, { backgroundColor: theme.background.surface }]}>
            <Ionicons name="search-outline" size={36} color={theme.text.disabled} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No results</Text>
          <Text style={[styles.emptySub, { color: theme.text.secondary }]}>
            No transactions found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    const { title, sub } = getEmptyMessage();
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.background.surface }]}>
          <Ionicons name="swap-horizontal-outline" size={36} color={theme.text.disabled} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.emptySub, { color: theme.text.secondary }]}>{sub}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScreenHeader title="Processor" />

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.background.surface,
              borderColor: searchFocused ? `${theme.secondary.main}66` : theme.inputBorder,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={searchFocused ? theme.secondary.main : theme.text.disabled}
          />
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, { color: theme.text.primary }]}
            placeholder="Search by slug or ID (e.g. QP-X7K2M9)"
            placeholderTextColor={theme.text.disabled}
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
              <Ionicons name="close-circle" size={18} color={theme.text.muted} />
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
                    backgroundColor: theme.background.surface,
                    borderColor: theme.inputBorder,
                  },
                  isActive && {
                    backgroundColor: `${theme.secondary.main}1A`,
                    borderColor: `${theme.secondary.main}4D`,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? theme.secondary.main : theme.text.muted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: theme.text.secondary },
                    isActive && { color: theme.secondary.main, fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: theme.action.selected },
                      isActive && { backgroundColor: `${theme.secondary.main}33` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: theme.text.secondary },
                        isActive && { color: theme.secondary.main },
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
        <Text style={[styles.countText, { color: theme.text.secondary }]}>
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
            tintColor={theme.secondary.main}
            colors={[theme.secondary.main]}
            progressBackgroundColor={theme.background.surface}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slugBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  slugText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  cardMiddle: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sendAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  receiveAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corridorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  methodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
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

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
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import type { TransactionStatus, TransactionDetail } from '../../types/transaction';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';

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

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING_DEPOSIT: { label: 'Pending', color: '#FFD460', bgColor: 'rgba(255,212,96,0.12)', icon: 'time-outline' },
  DEPOSIT_CONFIRMED: { label: 'Ready', color: '#00E5A0', bgColor: 'rgba(0,229,160,0.12)', icon: 'checkmark-circle-outline' },
  MATCHED: { label: 'Matched', color: '#1A6FFF', bgColor: 'rgba(26,111,255,0.12)', icon: 'link-outline' },
  SETTLEMENT_IN_PROGRESS: { label: 'Settling', color: '#FF9F43', bgColor: 'rgba(255,159,67,0.12)', icon: 'hourglass-outline' },
  SETTLEMENT_PROOF_UPLOADED: { label: 'Proof Sent', color: '#A855F7', bgColor: 'rgba(168,85,247,0.12)', icon: 'document-attach-outline' },
  COMPLETED: { label: 'Completed', color: '#00E5A0', bgColor: 'rgba(0,229,160,0.12)', icon: 'checkmark-done-outline' },
  FAILED: { label: 'Failed', color: '#FF4D6A', bgColor: 'rgba(255,77,106,0.12)', icon: 'close-circle-outline' },
  EXPIRED: { label: 'Expired', color: '#FF6B6B', bgColor: 'rgba(255,107,107,0.12)', icon: 'timer-outline' },
  DISPUTED: { label: 'Disputed', color: '#FFD460', bgColor: 'rgba(255,212,96,0.12)', icon: 'warning-outline' },
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
    const status = statusConfig[item.status];
    const recvSymbol = currencySymbols[item.receiveCurrency] || '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleTransactionPress(item.id, item.slug)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.slugBadge}>
            <Text style={styles.slugText}>{item.slug}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.amountRow}>
            <Text style={styles.sendAmount}>
              {item.sendAmount} {item.sendCurrency}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,245,0.4)" />
            <Text style={styles.receiveAmount}>
              {recvSymbol}
              {item.receiveAmount.toLocaleString()} {item.receiveCurrency}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.corridorText}>{item.corridorDisplay}</Text>
            <Text style={styles.dotSeparator}>{'\u00B7'}</Text>
            <Text style={styles.methodText}>{item.recipientAccountLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,245,0.3)" />
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
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={36} color="rgba(255,255,245,0.2)" />
          </View>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySub}>
            No transactions found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    const { title, sub } = getEmptyMessage();
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="swap-horizontal-outline" size={36} color="rgba(255,255,245,0.2)" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Processor" />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={searchFocused ? '#00E5A0' : 'rgba(255,255,245,0.3)'} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search by slug or ID (e.g. QP-X7K2M9)"
            placeholderTextColor="rgba(255,255,245,0.3)"
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
              <Ionicons name="close-circle" size={18} color="rgba(255,255,245,0.4)" />
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
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#00E5A0' : 'rgba(255,255,245,0.4)'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
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
        <Text style={styles.countText}>
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
            tintColor="#00E5A0"
            colors={['#00E5A0']}
            progressBackgroundColor="#222236"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    height: 44,
  },
  searchBarFocused: {
    borderColor: 'rgba(0,229,160,0.4)',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
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
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderColor: 'rgba(0,229,160,0.3)',
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
  },
  tabLabelActive: {
    color: '#00E5A0',
    fontFamily: 'Inter_600SemiBold',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,245,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0,229,160,0.2)',
  },
  tabBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,245,0.5)',
  },
  tabBadgeTextActive: {
    color: '#00E5A0',
  },
  countText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
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
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  slugText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#00E5A0',
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
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
    color: '#FFFFF5',
  },
  receiveAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#00E5A0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corridorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.6)',
  },
  dotSeparator: {
    color: 'rgba(255,255,245,0.3)',
  },
  methodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,245,0.6)',
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
    backgroundColor: '#222236',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFF5',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

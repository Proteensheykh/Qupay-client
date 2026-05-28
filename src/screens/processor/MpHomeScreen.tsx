import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { QupayLogo, StatusBadge } from '../../components';
import { useUser } from '../../hooks/useUser';
import { useMpProfile, useToggleMpStatus } from '../../hooks/useMpProfile';
import { useMpQueue } from '../../hooks/useMpQueue';
import { useMyOrders } from '../../hooks/useMyOrders';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import { toStatusGroup } from '../../utils/transactionStatus';
import type { MpOrder } from '../../api/mpOrders';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { typography } from '../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'MpHome'>;
type TabKey = 'queue' | 'active' | 'completed';

export const MpHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const toast = useToast();
  const { data: mpProfile, refetch: refetchProfile } = useMpProfile();
  const toggleStatus = useToggleMpStatus();
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useMpQueue();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useMyOrders();

  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [refreshing, setRefreshing] = useState(false);

  const isOnline = mpProfile?.status === 'ONLINE';
  const isSuspended = mpProfile?.status === 'SUSPENDED';

  const activeOrders = useMemo(
    () => (orders ?? []).filter((o) => {
      const group = toStatusGroup(o.status);
      return group === 'PENDING' || group === 'IN_PROGRESS';
    }),
    [orders]
  );

  const completedOrders = useMemo(
    () => (orders ?? []).filter((o) => {
      const group = toStatusGroup(o.status);
      return group === 'COMPLETED' || group === 'FAILED';
    }),
    [orders]
  );

  const currentList: MpOrder[] = activeTab === 'queue'
    ? (queue ?? [])
    : activeTab === 'active'
      ? activeOrders
      : completedOrders;

  const handleToggle = useCallback(async () => {
    if (isSuspended) {
      toast.error('Your account is suspended. Contact support.');
      return;
    }
    try {
      await toggleStatus.mutateAsync(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [isOnline, isSuspended, toggleStatus, toast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchQueue(), refetchOrders()]);
    setRefreshing(false);
  }, [refetchProfile, refetchQueue, refetchOrders]);

  const renderItem = useCallback(({ item }: { item: MpOrder }) => {
    const group = toStatusGroup(item.status);
    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: palette.grey[800] }]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('OrderDetail', {
            transactionId: item.transactionId,
            orderId: item.orderId,
            isQueueItem: activeTab === 'queue',
          })
        }
      >
        <View style={styles.orderTop}>
          <Text style={[styles.orderCode, { color: palette.grey[300] }]}>
            {item.transactionCode}
          </Text>
          <StatusBadge
            label={item.status}
            variant={group === 'COMPLETED' ? 'success' : group === 'FAILED' ? 'error' : 'warning'}
          />
        </View>
        <View style={styles.orderBody}>
          <Text style={[styles.orderAmount, { color: palette.grey[100] }]}>
            {item.originalAmount?.toLocaleString()} {item.fromCurrency}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={palette.grey[500]} />
          <Text style={[styles.orderAmount, { color: palette.grey[100] }]}>
            {item.convertedAmount?.toLocaleString()} {item.toCurrency}
          </Text>
        </View>
        <Text style={[styles.orderDate, { color: palette.grey[600] }]}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    );
  }, [navigation, activeTab]);

  const loading = activeTab === 'queue' ? queueLoading : ordersLoading;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <QupayLogo size={22} />
          <Text style={[styles.greeting, { color: palette.grey[400] }]}>
            Hi {user?.firstName ?? 'there'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {mpProfile && (
            <TouchableOpacity
              onPress={handleToggle}
              style={[
                styles.togglePill,
                { backgroundColor: isOnline ? 'rgba(122,232,112,0.12)' : palette.grey[800] },
              ]}
              activeOpacity={0.7}
              disabled={toggleStatus.isPending}
            >
              <View style={[styles.toggleDot, { backgroundColor: isOnline ? palette.status.positive : palette.grey[600] }]} />
              <Text style={[styles.toggleText, { color: isOnline ? palette.status.positive : palette.grey[500] }]}>
                {isSuspended ? 'Suspended' : isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('MpProfile')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={palette.grey[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: palette.grey[800] }]}>
        {(['queue', 'active', 'completed'] as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'queue' ? (queue?.length ?? 0) : tab === 'active' ? activeOrders.length : completedOrders.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && { borderBottomColor: palette.royal[500], borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: isActive ? palette.grey[200] : palette.grey[500] }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: isActive ? palette.royal[500] : palette.grey[700] }]}>
                  <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : palette.grey[400] }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading && currentList.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={palette.royal[500]} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.royal[500]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="file-tray-outline" size={40} color={palette.grey[600]} />
              <Text style={[styles.emptyTitle, { color: palette.grey[400] }]}>
                {activeTab === 'queue' ? 'No orders in queue' : activeTab === 'active' ? 'No active orders' : 'No completed orders'}
              </Text>
              {activeTab === 'queue' && (
                <Text style={[styles.emptySub, { color: palette.grey[600] }]}>
                  {isOnline ? 'New orders will appear here' : 'Go online to see the queue'}
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { ...typography.bodySm, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  orderCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCode: { fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.5 },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  orderAmount: { fontFamily: 'Inter_700Bold', fontSize: 16, fontVariant: ['tabular-nums'] },
  orderDate: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, textAlign: 'center' },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
});

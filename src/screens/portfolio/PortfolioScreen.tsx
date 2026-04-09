import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientAvatar, ScreenHeader } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<HistoryStackParamList, 'History'>;

interface HistoryItem {
  id: string;
  name: string;
  initials: string;
  colors: [string, string];
  method: string;
  timeLabel: string;
  corridor: string;
  receiveAmount: string;
  sentLabel: string;
  status: 'delivered' | 'pending' | 'failed' | 'disputed';
}

const historyItems: HistoryItem[] = [
  { id: '1', name: 'Emeka Johnson', initials: 'EJ', colors: ['#1a6fff', '#00e5a0'], method: 'OPay', timeLabel: '2 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6329,000', sentLabel: '200 USDT \u00B7 4m 11s', status: 'delivered' },
  { id: '2', name: 'Kofi Mensah', initials: 'KM', colors: ['#ff9f43', '#00e5a0'], method: 'MTN Momo', timeLabel: '5 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1EC}\u{1F1ED}', receiveAmount: '\u20B5690', sentLabel: '50 USDT \u00B7 3m 42s', status: 'delivered' },
  { id: '3', name: 'Adaeze Obi', initials: 'AO', colors: ['#a855f7', '#1a6fff'], method: 'GTBank', timeLabel: '3 hours ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6164,500', sentLabel: '100 USDT \u00B7 In progress', status: 'pending' },
  { id: '4', name: 'Chidi Nwosu', initials: 'CN', colors: ['#ff6b6b', '#ffd460'], method: 'PalmPay', timeLabel: '2 weeks ago', corridor: 'Node failed \u00B7 Refunded', receiveAmount: '\u21A9 Refunded', sentLabel: '50 USDT returned', status: 'failed' },
  { id: '5', name: 'Tunde Kareem', initials: 'TK', colors: ['#ff9f43', '#ee5a24'], method: '', timeLabel: '', corridor: 'Recipient disputed \u00B7 Tap to resolve', receiveAmount: '\u20A682,250', sentLabel: '50 USDT', status: 'disputed' },
];

const statusDotStyle = (status: HistoryItem['status']) => {
  switch (status) {
    case 'delivered': return { bg: '#00E5A0', icon: '\u2713' };
    case 'pending': return { bg: '#FFD460', icon: '\u2026' };
    case 'failed': return { bg: '#FF4D6A', icon: '\u2717' };
    case 'disputed': return { bg: '#FFD460', icon: '!' };
  }
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="History" />
      {historyItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={36} color="rgba(255,255,245,0.2)" />
          </View>
          <Text style={styles.emptyTitle}>No transfers yet</Text>
          <Text style={styles.emptySub}>Your transfer history will appear here once you send your first payment.</Text>
        </View>
      ) : (
      <>
      <Text style={styles.countText}>{historyItems.length} transfers</Text>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E5A0"
            colors={['#00E5A0']}
            progressBackgroundColor="#222236"
          />
        }
      >
        {historyItems.map((item) => {
          const dot = statusDotStyle(item.status);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() =>
                navigation.navigate('TransferDetail', { transferId: item.id, status: item.status })
              }
              activeOpacity={0.7}
            >
              <View style={styles.avWrap}>
                <GradientAvatar initials={item.initials} size={44} colors={item.colors} fontSize={13} />
                <View style={[styles.statusDot, { backgroundColor: dot.bg }]}>
                  <Text style={styles.statusDotText}>{dot.icon}</Text>
                </View>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text
                  style={[
                    styles.detail,
                    item.status === 'disputed' && { color: '#FFD460' },
                  ]}
                >
                  {item.status === 'disputed'
                    ? item.corridor
                    : `${item.method} \u00B7 ${item.timeLabel} \u00B7 ${item.corridor}`}
                </Text>
              </View>
              <View style={styles.amtCol}>
                <Text
                  style={[
                    styles.receiveAmt,
                    item.status === 'failed' && { color: '#FF4D6A' },
                  ]}
                >
                  {item.receiveAmount}
                </Text>
                <Text style={styles.sentLabel}>{item.sentLabel}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
      </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  countText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
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
    borderColor: '#111118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 7,
    color: '#fff',
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
  },
  detail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 2,
  },
  amtCol: { alignItems: 'flex-end' },
  receiveAmt: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#00E5A0',
  },
  sentLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 1,
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

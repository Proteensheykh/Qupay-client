import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { Avatar, ScreenHeader } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import { useTheme, type ThemeColors } from '../../theme';

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
  { id: '1', name: 'Emeka Johnson', initials: 'EJ', colors: ['#1a6fff', '#38BDF8'], method: 'OPay', timeLabel: '2 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6329,000', sentLabel: '200 USDT \u00B7 4m 11s', status: 'delivered' },
  { id: '2', name: 'Kofi Mensah', initials: 'KM', colors: ['#ff9f43', '#38BDF8'], method: 'MTN Momo', timeLabel: '5 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1EC}\u{1F1ED}', receiveAmount: '\u20B5690', sentLabel: '50 USDT \u00B7 3m 42s', status: 'delivered' },
  { id: '3', name: 'Adaeze Obi', initials: 'AO', colors: ['#a855f7', '#1a6fff'], method: 'GTBank', timeLabel: '3 hours ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6164,500', sentLabel: '100 USDT \u00B7 In progress', status: 'pending' },
  { id: '4', name: 'Chidi Nwosu', initials: 'CN', colors: ['#F87171', '#FFD60A'], method: 'PalmPay', timeLabel: '2 weeks ago', corridor: 'Node failed \u00B7 Refunded', receiveAmount: '\u21A9 Refunded', sentLabel: '50 USDT returned', status: 'failed' },
  { id: '5', name: 'Tunde Kareem', initials: 'TK', colors: ['#ff9f43', '#ee5a24'], method: '', timeLabel: '', corridor: 'Recipient disputed \u00B7 Tap to resolve', receiveAmount: '\u20A682,250', sentLabel: '50 USDT', status: 'disputed' },
];

const statusDotStyle = (status: HistoryItem['status'], theme: ThemeColors) => {
  switch (status) {
    case 'delivered': return { bg: theme.success.main, icon: '\u2713' };
    case 'pending': return { bg: theme.warning.main, icon: '\u2026' };
    case 'failed': return { bg: theme.error.main, icon: '\u2717' };
    case 'disputed': return { bg: theme.warning.main, icon: '!' };
  }
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScreenHeader title="History" />
      {historyItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.background.surface }]}>
            <Ionicons name="time-outline" size={36} color={theme.text.disabled} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No transfers yet</Text>
          <Text style={[styles.emptySub, { color: theme.text.muted }]}>Your transfer history will appear here once you send your first payment.</Text>
        </View>
      ) : (
      <>
      <Text style={[styles.countText, { color: theme.text.secondary }]}>{historyItems.length} transfers</Text>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.secondary.main}
            colors={[theme.secondary.main]}
            progressBackgroundColor={theme.background.surface}
          />
        }
      >
        {historyItems.map((item) => {
          const dot = statusDotStyle(item.status, theme);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, { borderBottomColor: theme.inputBorder }]}
              onPress={() =>
                navigation.navigate('TransferDetail', { transferId: item.id, status: item.status })
              }
              activeOpacity={0.7}
            >
              <View style={styles.avWrap}>
                <Avatar seed={item.name} size={44} />
                <View style={[styles.statusDot, { backgroundColor: dot.bg, borderColor: theme.background.default }]}>
                  <Text style={[styles.statusDotText, { color: theme.text.primary }]}>{dot.icon}</Text>
                </View>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text.primary }]}>{item.name}</Text>
                <Text
                  style={[
                    styles.detail,
                    { color: theme.text.secondary },
                    item.status === 'disputed' && { color: theme.warning.main },
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
                    { color: theme.secondary.main },
                    item.status === 'failed' && { color: theme.error.main },
                  ]}
                >
                  {item.receiveAmount}
                </Text>
                <Text style={[styles.sentLabel, { color: theme.text.secondary }]}>{item.sentLabel}</Text>
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
  safe: { flex: 1 },
  scroll: { flex: 1 },
  countText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
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
    fontFamily: 'Inter_700Bold',
    fontSize: 7,
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  detail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  amtCol: { alignItems: 'flex-end' },
  receiveAmt: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  sentLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
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

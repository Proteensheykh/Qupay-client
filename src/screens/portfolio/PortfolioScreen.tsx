import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { Avatar, ScreenHeader, usePullToRefresh, Odometer } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme/typography';

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
  { id: '1', name: 'Emeka Johnson', initials: 'EJ', colors: ['#9E79D2', '#B893EC'], method: 'OPay', timeLabel: '2 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6329,000', sentLabel: '200 USDT \u00B7 4m 11s', status: 'delivered' },
  { id: '2', name: 'Kofi Mensah', initials: 'KM', colors: ['#ff9f43', '#B893EC'], method: 'MTN Momo', timeLabel: '5 days ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1EC}\u{1F1ED}', receiveAmount: '\u20B5690', sentLabel: '50 USDT \u00B7 3m 42s', status: 'delivered' },
  { id: '3', name: 'Adaeze Obi', initials: 'AO', colors: ['#a855f7', '#1a6fff'], method: 'GTBank', timeLabel: '3 hours ago', corridor: '\u{1F1F8}\u{1F1EC}\u2192\u{1F1F3}\u{1F1EC}', receiveAmount: '\u20A6164,500', sentLabel: '100 USDT \u00B7 In progress', status: 'pending' },
  { id: '4', name: 'Chidi Nwosu', initials: 'CN', colors: ['#F87171', '#FFD60A'], method: 'PalmPay', timeLabel: '2 weeks ago', corridor: 'Node failed \u00B7 Refunded', receiveAmount: '\u21A9 Refunded', sentLabel: '50 USDT returned', status: 'failed' },
  { id: '5', name: 'Tunde Kareem', initials: 'TK', colors: ['#ff9f43', '#ee5a24'], method: '', timeLabel: '', corridor: 'Recipient disputed \u00B7 Tap to resolve', receiveAmount: '\u20A682,250', sentLabel: '50 USDT', status: 'disputed' },
];

const statPills = [
  { key: '24h', label: '24h', value: '+2.4%' },
  { key: '7d', label: '7d', value: '+5.1%' },
  { key: '30d', label: '30d', value: '+12.3%' },
];

const statusDotStyle = (status: HistoryItem['status']) => {
  switch (status) {
    case 'delivered': return { bg: palette.status.positive, icon: '\u2713' };
    case 'pending': return { bg: palette.status.partial, icon: '\u2026' };
    case 'failed': return { bg: palette.status.negative, icon: '\u2717' };
    case 'disputed': return { bg: palette.status.partial, icon: '!' };
  }
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { refreshControl } = usePullToRefresh();

  const backdrop = palette.grey[900];
  const hairline = palette.material.lightThin;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top']}>
      <ScreenHeader title="History" />
      {historyItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.grey[800] }]}>
            <Ionicons name="time-outline" size={36} color={palette.grey[600]} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.grey[300] }]}>No transfers yet</Text>
          <Text style={[styles.emptySub, { color: palette.grey[500] }]}>Your transfer history will appear here once you send your first payment.</Text>
        </View>
      ) : (
      <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.balanceBlock}>
          <Text style={[styles.balanceLabel, { color: palette.grey[500] }]}>Total balance</Text>
          <View style={styles.odometerRow}>
            <Text style={[styles.currencyPrefix, { color: palette.grey[300] }]}>$</Text>
            <Odometer value="12,847.52" fontSize={49} color={palette.grey[300]} staggerMs={22} />
          </View>
          <View style={styles.statStrip}>
            {statPills.map((p) => (
              <View
                key={p.key}
                style={[
                  styles.statPill,
                  { backgroundColor: palette.grey[800] },
                  borders.hairline.dark,
                  { borderRadius: radii.xl },
                ]}
              >
                <Text style={[styles.statPillLabel, { color: palette.grey[500] }]}>{p.label}</Text>
                <Text style={[styles.statPillValue, { color: palette.grey[300] }]}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.grey[500] }]}>Assets</Text>
        <Text style={[styles.countText, { color: palette.grey[500] }]}>{historyItems.length} transfers</Text>

        {historyItems.map((item) => {
          const dot = statusDotStyle(item.status);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, { borderBottomColor: hairline }]}
              onPress={() =>
                navigation.navigate('TransferDetail', { transferId: item.id, status: item.status })
              }
              activeOpacity={0.7}
            >
              <View style={styles.avWrap}>
                <Avatar seed={item.name} size={44} />
                <View style={[styles.statusDot, { backgroundColor: dot.bg, borderColor: backdrop }]}>
                  <Text style={[styles.statusDotText, { color: palette.grey[900] }]}>{dot.icon}</Text>
                </View>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: palette.grey[300] }]}>{item.name}</Text>
                <Text
                  style={[
                    styles.detail,
                    { color: palette.grey[500] },
                    item.status === 'disputed' && { color: palette.status.partial },
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
                    { color: palette.grey[300] },
                    item.status === 'failed' && { color: palette.status.negative },
                  ]}
                >
                  {item.receiveAmount}
                </Text>
                <Text style={[styles.sentLabel, { color: palette.grey[500] }]}>{item.sentLabel}</Text>
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
  balanceBlock: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  balanceLabel: {
    ...typography.subheader2,
    marginBottom: 8,
  },
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencyPrefix: {
    ...typography.display2,
    marginRight: 2,
  },
  statStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statPillLabel: {
    ...typography.subheader2,
  },
  statPillValue: {
    ...typography.monoSm,
  },
  sectionTitle: {
    ...typography.label,
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  countText: {
    ...typography.subheader2,
    paddingHorizontal: 24,
    paddingBottom: 14,
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
    fontFamily: 'Geist_400Regular',
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
    ...typography.h4,
    marginBottom: 8,
  },
  emptySub: {
    ...typography.bodySm,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { Avatar, BankLogo, CryptoIcon, StatusBadge } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<HistoryStackParamList, 'TransferDetail'>;
type TransferStatus = 'delivered' | 'pending' | 'failed' | 'disputed';

interface StatusConfig {
  label: string;
  badgeVariant: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  showSendAgain: boolean;
}

function getStatusConfig(): Record<TransferStatus, StatusConfig> {
  return {
    delivered: {
      label: 'Delivered',
      badgeVariant: 'success',
      icon: 'checkmark',
      showSendAgain: true,
    },
    pending: {
      label: 'In progress',
      badgeVariant: 'warning',
      icon: 'time',
      showSendAgain: false,
    },
    failed: {
      label: 'Refunded',
      badgeVariant: 'error',
      icon: 'close',
      showSendAgain: false,
    },
    disputed: {
      label: 'Disputed',
      badgeVariant: 'warning',
      icon: 'alert-circle',
      showSendAgain: false,
    },
  };
}

const hairline = {
  borderBottomColor: palette.material.lightThin,
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
        { color: palette.grey[300] },
        mono && styles.rowValueMono,
        emphasis && { color: palette.royal[400] },
      ]}
    >
      {value}
    </Text>
  </View>
);

const ActionRow: React.FC<{
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}> = ({ icon, label, sub, onPress }) => (
  <TouchableOpacity style={[styles.actionRow, hairline]} activeOpacity={0.6} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: palette.grey[800] }, borders.hairline.dark]}>
      <Ionicons name={icon as any} size={18} color={palette.royal[400]} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.actionLabel, { color: palette.grey[300] }]}>{label}</Text>
      <Text style={[styles.actionSub, { color: palette.grey[500] }]}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={palette.grey[600]} />
  </TouchableOpacity>
);

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const status = (route.params?.status as TransferStatus) || 'delivered';
  const config = getStatusConfig()[status];

  const recipientName = 'Emeka Johnson';
  const firstName = recipientName.split(' ')[0];
  const method = 'OPay';
  const country = 'Nigeria';
  const phone = '0812 456 7890';

  const sendAgain = () => navigation.goBack();
  const goHome = () => navigation.goBack();

  const backdrop = palette.grey[900];
  const cardSurface = palette.grey[800];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <View style={styles.iconBtn} />
        <Text style={[styles.headerTitle, { color: palette.grey[300] }]}>Receipt</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={goHome} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={palette.grey[300]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <Text style={styles.heroAmount}>{'\u20A6'}329,000</Text>
          <View style={styles.heroBadgeWrap}>
            <StatusBadge label={config.label} variant={config.badgeVariant} />
          </View>
          <Text style={[styles.heroSub, { color: palette.grey[500] }]}>to {recipientName}</Text>
        </View>

        <View
          style={[
            styles.timelineCard,
            { backgroundColor: cardSurface },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <View style={[styles.recipientRow, hairline]}>
            <Avatar seed={recipientName} initials="EJ" size={44} bankBadge={method} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.recipientName, { color: palette.grey[300] }]}>{recipientName}</Text>
              <Text style={[styles.recipientSub, { color: palette.grey[500] }]}>
                {method} {'\u00B7'} {country}
              </Text>
            </View>
          </View>
          <View style={[styles.sentRow, hairline]}>
            <Text style={[styles.rowLabel, { color: palette.grey[500] }]}>You sent</Text>
            <View style={styles.sentValueWrap}>
              <CryptoIcon token="USDT" network="Polygon" size={22} ringColor={cardSurface} />
              <Text style={[styles.sentValueText, { color: palette.grey[300] }]}>200 USDT</Text>
            </View>
          </View>
          <Row label="They received" value={'\u20A6329,000'} emphasis />
          <Row label="Rate" value={'1 USDT = \u20A61,645'} />
          <Row label="Fee" value={'\u20A63,290 (0.98%)'} />
          <Row label="Network" value="Polygon (PoS)" />
          <Row label="Delivered in" value="4m 11s" />
          <Row label="Delivered at" value={'21 Mar 2026 \u00B7 09:41 SGT'} />
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              Clipboard.setStringAsync('QP-2026-0384-7821');
              Alert.alert('Copied', 'Reference copied to clipboard.');
            }}
          >
            <Row label="Reference" value="QP-2026-0384-7821" mono />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.providerCard,
            { backgroundColor: cardSurface },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <BankLogo name={method} size={36} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.providerLabel, { color: palette.grey[500] }]}>Cashed out via</Text>
            <Text style={[styles.providerName, { color: palette.grey[300] }]}>
              {method} {'\u00B7'} {phone}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={18} color={palette.status.positive} />
        </View>

        <View
          style={[
            styles.actionsCard,
            { backgroundColor: cardSurface },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <ActionRow
            icon="cloud-download"
            label="Save receipt"
            sub="Download a PDF copy"
            onPress={() => Alert.alert('Save receipt', 'Receipt saved to your device.')}
          />
          <ActionRow
            icon="share"
            label="Share with recipient"
            sub="Send a link with delivery details"
            onPress={() => Alert.alert('Share', `Receipt link for ${recipientName} copied to clipboard.`)}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: palette.material.lightThin }]}>
        {config.showSendAgain && (
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: palette.royal[500] }]}
            onPress={sendAgain}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color={palette.grey[900]} />
            <Text style={[styles.ctaPrimaryText, { color: palette.grey[900] }]}>Send to {firstName} again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.ctaSecondary, { backgroundColor: palette.grey[800] }, borders.hairline.dark]}
          onPress={goHome}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaSecondaryText, { color: palette.grey[300] }]}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

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
    color: palette.grey[300],
  },
  heroSub: {
    ...typography.bodySm,
    marginTop: 10,
  },

  timelineCard: {
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recipientName: {
    ...typography.buttonS,
  },
  recipientSub: {
    ...typography.subheader2,
    marginTop: 2,
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
  },
  sentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sentValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentValueText: {
    ...typography.bodySm,
    fontVariant: ['tabular-nums'],
  },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  providerLabel: {
    ...typography.labelSm,
  },
  providerName: {
    ...typography.buttonS,
    marginTop: 1,
  },

  actionsCard: {
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.buttonS,
  },
  actionSub: {
    ...typography.subheader2,
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaPrimary: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radii.pill,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    ...typography.buttonM,
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

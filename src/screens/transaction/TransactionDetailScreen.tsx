import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '../../components/Icon';
import { Avatar, BankLogo, CryptoIcon } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';
import { useTheme, type ThemeColors } from '../../theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'TransferDetail'>;
type TransferStatus = 'delivered' | 'pending' | 'failed' | 'disputed';

interface StatusConfig {
  label: string;
  color: string;
  glow: [string, string];
  icon: string;
  showSendAgain: boolean;
}

function getStatusConfig(theme: ThemeColors): Record<TransferStatus, StatusConfig> {
  return {
    delivered: {
      label: 'Delivered',
      color: theme.secondary.main,
      glow: [theme.info.bg, theme.background.default],
      icon: 'checkmark',
      showSendAgain: true,
    },
    pending: {
      label: 'In progress',
      color: theme.secondary.main,
      glow: [theme.info.bg, theme.background.default],
      icon: 'time',
      showSendAgain: false,
    },
    failed: {
      label: 'Refunded',
      color: theme.error.main,
      glow: [theme.error.bg, theme.background.default],
      icon: 'close',
      showSendAgain: false,
    },
    disputed: {
      label: 'Disputed',
      color: theme.warning.main,
      glow: [theme.warning.bg, theme.background.default],
      icon: 'alert-circle',
      showSendAgain: false,
    },
  };
}

const Row: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
  theme: ThemeColors;
}> = ({ label, value, mono, emphasis, theme }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        { color: theme.text.primary },
        mono && styles.rowValueMono,
        emphasis && [styles.rowValueEmphasis, { color: theme.secondary.main }],
      ]}
    >
      {value}
    </Text>
  </View>
);

const Divider: React.FC<{ theme: ThemeColors }> = ({ theme }) => (
  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
);

const ActionRow: React.FC<{
  theme: ThemeColors;
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}> = ({ theme, icon, label, sub, onPress }) => (
  <TouchableOpacity style={styles.actionRow} activeOpacity={0.6} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: theme.info.bg }]}>
      <Ionicons name={icon as any} size={18} color={theme.secondary.main} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.actionLabel, { color: theme.text.primary }]}>{label}</Text>
      <Text style={[styles.actionSub, { color: theme.text.secondary }]}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.text.muted} />
  </TouchableOpacity>
);

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const status = (route.params?.status as TransferStatus) || 'delivered';
  const config = getStatusConfig(theme)[status];

  const recipientName = 'Emeka Johnson';
  const firstName = recipientName.split(' ')[0];
  const method = 'OPay';
  const country = 'Nigeria';
  const phone = '0812 456 7890';

  const sendAgain = () => navigation.goBack();
  const goHome = () => navigation.goBack();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top', 'bottom']}>
      <LinearGradient pointerEvents="none" colors={config.glow} style={styles.glow} />

      <View style={styles.headerBar}>
        <View style={styles.iconBtn} />
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Receipt</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={goHome} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <View style={[styles.checkCircle, { backgroundColor: config.color + '22' }]}>
            <Ionicons name={config.icon as any} size={48} color={config.color} />
          </View>
          <Text style={[styles.heroLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={[styles.heroAmount, { color: theme.text.primary }]}>{'\u20A6'}329,000</Text>
          <Text style={[styles.heroSub, { color: theme.text.secondary }]}>to {recipientName}</Text>
        </View>

        <View style={[styles.recipientCard, { backgroundColor: theme.background.paper }]}>
          <Avatar seed={recipientName} initials="EJ" size={44} bankBadge={method} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.recipientName, { color: theme.text.primary }]}>{recipientName}</Text>
            <Text style={[styles.recipientSub, { color: theme.text.secondary }]}>
              {method} {'\u00B7'} {country}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: config.color + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusPillText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={[styles.detailsCard, { backgroundColor: theme.background.paper }]}>
          <View style={styles.sentRow}>
            <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>You sent</Text>
            <View style={styles.sentValueWrap}>
              <CryptoIcon token="USDT" network="Polygon" size={22} ringColor={theme.background.paper} />
              <Text style={[styles.sentValueText, { color: theme.text.primary }]}>200 USDT</Text>
            </View>
          </View>
          <Divider theme={theme} />
          <Row label="They received" value={'\u20A6329,000'} emphasis theme={theme} />
          <Divider theme={theme} />
          <Row label="Rate" value={'1 USDT = \u20A61,645'} theme={theme} />
          <Divider theme={theme} />
          <Row label="Fee" value={'\u20A63,290 (0.98%)'} theme={theme} />
          <Divider theme={theme} />
          <Row label="Network" value="Polygon (PoS)" theme={theme} />
          <Divider theme={theme} />
          <Row label="Delivered in" value="4m 11s" theme={theme} />
          <Divider theme={theme} />
          <Row label="Delivered at" value={'21 Mar 2026 \u00B7 09:41 SGT'} theme={theme} />
          <Divider theme={theme} />
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              Clipboard.setStringAsync('QP-2026-0384-7821');
              Alert.alert('Copied', 'Reference copied to clipboard.');
            }}
          >
            <Row label="Reference" value="QP-2026-0384-7821" mono theme={theme} />
          </TouchableOpacity>
        </View>

        <View style={[styles.providerCard, { backgroundColor: theme.background.paper }]}>
          <BankLogo name={method} size={36} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.providerLabel, { color: theme.text.secondary }]}>Cashed out via</Text>
            <Text style={[styles.providerName, { color: theme.text.primary }]}>
              {method} {'\u00B7'} {phone}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={18} color={config.color} />
        </View>

        <View style={[styles.actionsCard, { backgroundColor: theme.background.paper }]}>
          <ActionRow
            theme={theme}
            icon="cloud-download"
            label="Save receipt"
            sub="Download a PDF copy"
            onPress={() => Alert.alert('Save receipt', 'Receipt saved to your device.')}
          />
          <Divider theme={theme} />
          <ActionRow
            theme={theme}
            icon="share"
            label="Share with recipient"
            sub="Send a link with delivery details"
            onPress={() => Alert.alert('Share', `Receipt link for ${recipientName} copied to clipboard.`)}
          />
          <Divider theme={theme} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {config.showSendAgain && (
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: theme.secondary.main }]}
            onPress={sendAgain}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color={theme.background.default} />
            <Text style={[styles.ctaPrimaryText, { color: theme.background.default }]}>Send to {firstName} again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.ctaSecondary, { backgroundColor: theme.background.surface }]}
          onPress={goHome}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaSecondaryText, { color: theme.text.primary }]}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },

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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },

  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
    marginTop: 6,
    letterSpacing: -0.8,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 4,
  },

  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
  },
  recipientName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  recipientSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },

  detailsCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  rowValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  rowValueMono: {
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
  },
  rowValueEmphasis: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  sentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sentValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentValueText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  divider: { height: 1 },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  providerLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  providerName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 1,
  },

  actionsCard: {
    borderRadius: 16,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 12,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  actionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 8,
  },
  ctaPrimary: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  ctaSecondary: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, StatusBadge, GradientAvatar, CTAButton } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<HistoryStackParamList, 'TransferDetail'>;

type TransferStatus = 'delivered' | 'pending' | 'failed' | 'disputed';

const getStatusConfig = (status: TransferStatus) => {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', variant: 'green' as const, icon: 'checkmark', iconColor: '#00E5A0', iconBg: 'rgba(0,229,160,0.12)', iconBorder: '#00E5A0' };
    case 'pending':
      return { label: 'Pending', variant: 'yellow' as const, icon: 'time-outline', iconColor: '#FFD460', iconBg: 'rgba(255,212,96,0.12)', iconBorder: '#FFD460' };
    case 'failed':
      return { label: 'Failed', variant: 'red' as const, icon: 'close', iconColor: '#FF4D6A', iconBg: 'rgba(255,77,106,0.1)', iconBorder: '#FF4D6A' };
    case 'disputed':
      return { label: 'Disputed', variant: 'yellow' as const, icon: 'alert-outline', iconColor: '#FFD460', iconBg: 'rgba(255,212,96,0.12)', iconBorder: '#FFD460' };
  }
};

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const status = (route.params?.status as TransferStatus) || 'delivered';
  const config = getStatusConfig(status);
  const [showDispute, setShowDispute] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Transfer"
        onBack={() => navigation.goBack()}
        right={<StatusBadge label={config.label} variant={config.variant} />}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status band */}
        <View style={styles.statusBand}>
          <View style={[styles.statusIcon, { backgroundColor: config.iconBg, borderColor: config.iconBorder }]}>
            <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={28} color={config.iconColor} />
          </View>
          <Text style={[styles.statusLabel, { color: config.iconColor }]}>
            {config.label.toUpperCase()}
          </Text>
          <Text style={styles.tdAmount}>{'\u20A6'}329,000</Text>
          <Text style={styles.tdRecv}>200 USDT sent {'\u00B7'} 4 mins 11 secs</Text>
          <View style={styles.tdCorridor}>
            <Text style={styles.tdCorridorText}>
              {'\u{1F1F8}\u{1F1EC}'} {'\u2192'} {'\u{1F1F3}\u{1F1EC}'} Singapore {'\u2192'} Nigeria
            </Text>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          {['Save', 'WhatsApp', 'Copy link', 'PDF'].map((label) => (
            <TouchableOpacity key={label} style={styles.actionBtn} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>
                {label === 'Save' ? '\u{1F4BE}' : label === 'WhatsApp' ? '\u{1F4AC}' : label === 'Copy link' ? '\u{1F517}' : '\u{1F4C4}'}
              </Text>
              <Text style={styles.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* No account note */}
        <View style={styles.noAcctBand}>
          <Text style={styles.noAcctIcon}>{'\u2139\uFE0F'}</Text>
          <View style={styles.noAcctTextWrap}>
            <Text style={styles.noAcctTitle}>Emeka doesn't have a Qupay account</Text>
            <Text style={styles.noAcctBody}>
              That's fine — they received a standard OPay credit directly to their mobile wallet. No Qupay account needed.
            </Text>
          </View>
        </View>

        {/* Receipt card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <GradientAvatar initials="EJ" size={40} colors={['#1a6fff', '#00e5a0']} fontSize={12} />
            <View style={styles.rhInfo}>
              <Text style={styles.rhName}>Emeka Johnson</Text>
              <Text style={styles.rhSub}>OPay {'\u00B7'} 0812 456 7890 {'\u00B7'} Nigeria</Text>
            </View>
            <View style={[styles.rhStatus, { backgroundColor: config.iconBg }]}>
              <Text style={[styles.rhStatusText, { color: config.iconColor }]}>
                {status === 'delivered' ? '\u2713 Delivered' : config.label}
              </Text>
            </View>
          </View>
          <View style={styles.receiptRows}>
            <ReceiptRow label="Amount received" value={'\u20A6329,000'} valueStyle={styles.greenVal} />
            <ReceiptRow label="You sent" value="200 USDT" />
            <ReceiptRow label="Exchange rate" value={'\u20A61,645 / USDT'} />
            <ReceiptRow label="Fee" value={'\u20A63,290 (0.98%)'} />
            <ReceiptRow label="From wallet" value="Qupay Wallet" />
            <ReceiptRow label="Network" value="Polygon" />
            <ReceiptRow label="Date & time" value="21 Mar 2026 \u00B7 09:41 SGT" />
            <ReceiptRow label="Reference" value="QP-2026-0384-7821" valueStyle={styles.refVal} isLast />
          </View>
        </View>

        {/* Dispute section */}
        {(status === 'delivered' || status === 'disputed') && (
          <View style={styles.disputeSection}>
            <TouchableOpacity
              style={styles.disputeBtn}
              onPress={() => setShowDispute(!showDispute)}
              activeOpacity={0.7}
            >
              <Text style={styles.disputeBtnText}>Recipient says they didn't receive it</Text>
            </TouchableOpacity>
            {showDispute && (
              <View style={styles.disputeOpts}>
                {[
                  "Recipient's account wasn't credited",
                  'Received wrong amount',
                  'Transfer showing as delivered but unconfirmed',
                  'Something else',
                ].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.disputeOpt} activeOpacity={0.7}>
                    <Text style={styles.disputeOptText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.disputeNote}>
                  Our team resolves disputes within 2 hours. Funds are protected until resolved.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomPad}>
          <CTAButton title="Send again to Emeka" onPress={() => navigation.goBack()} />
        </View>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ReceiptRow: React.FC<{
  label: string;
  value: string;
  valueStyle?: object;
  isLast?: boolean;
}> = ({ label, value, valueStyle, isLast }) => (
  <View style={[styles.rr, isLast && styles.rrLast]}>
    <Text style={styles.rrLabel}>{label}</Text>
    <Text style={[styles.rrValue, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  statusBand: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tdAmount: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 36,
    letterSpacing: -1,
    color: '#FFFFF5',
    marginBottom: 4,
  },
  tdRecv: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 16,
  },
  tdCorridor: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  tdCorridorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFF5',
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,245,0.6)',
  },
  // No account
  noAcctBand: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noAcctIcon: { fontSize: 20 },
  noAcctTextWrap: { flex: 1 },
  noAcctTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFF5',
    marginBottom: 2,
  },
  noAcctBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    lineHeight: 17,
  },
  // Receipt card
  receiptCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  rhInfo: { flex: 1 },
  rhName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
  },
  rhSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  rhStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  rhStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  receiptRows: {},
  rr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  rrLast: { borderBottomWidth: 0 },
  rrLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  rrValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#FFFFF5',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  greenVal: {
    color: '#00E5A0',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  refVal: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  // Dispute
  disputeSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  disputeBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    marginBottom: 8,
  },
  disputeBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    textAlign: 'center',
  },
  disputeOpts: {
    backgroundColor: 'rgba(255,77,106,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,106,0.2)',
    borderRadius: 12,
    padding: 14,
  },
  disputeOpt: {
    padding: 12,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 9,
    marginBottom: 8,
  },
  disputeOptText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#FFFFF5',
  },
  disputeNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    lineHeight: 17,
    marginTop: 8,
  },
  bottomPad: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, GradientAvatar, CTAButton, BottomSheet } from '../../components';
import { shadows } from '../../theme/spacing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'Amount'>;

export const AmountScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientInitials = 'EJ',
    recipientColors = ['#1a6fff', '#00e5a0'] as [string, string],
    recipientMethod = 'OPay',
    recipientPhone = '0812 456 7890',
    recipientFlag = '\u{1F1F3}\u{1F1EC}',
    lastAmount,
    dest,
  } = route.params || {};

  const rate = dest?.rate || 1645;
  const symbol = dest?.symbol || '\u20A6';
  const destCode = dest?.code || 'NGN';

  const [amount, setAmount] = useState(lastAmount?.toString() || '200');
  const [timerSecs, setTimerSecs] = useState(899); // 14:59
  const [showApproveSheet, setShowApproveSheet] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTimerSecs((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const receiveAmount = Math.round(numAmount * rate);
  const fee = Math.round(numAmount * rate * 0.01);
  const feePct = numAmount > 0 ? ((fee / (numAmount * rate)) * 100).toFixed(2) : '0';

  const formatTimer = useCallback(() => {
    const m = Math.floor(timerSecs / 60);
    const s = timerSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, [timerSecs]);

  const timerWarn = timerSecs < 120;
  const timerExpired = timerSecs === 0;

  const handleApprove = useCallback(() => {
    setApproving(true);
    setTimeout(() => {
      setApproving(false);
      setShowApproveSheet(false);
      navigation.navigate('Tracking', {
        recipientName,
        recipientInitials,
        recipientColors,
        recipientMethod,
        recipientFlag,
        amount: numAmount,
        receiveAmount,
        dest,
      });
    }, 1200);
  }, [navigation, recipientName, recipientInitials, recipientColors, recipientMethod, recipientFlag, numAmount, receiveAmount, dest]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="How much?" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Rate lock bar */}
        <View
          style={[
            styles.rateBar,
            timerWarn && styles.rateBarWarn,
            timerExpired && styles.rateBarExpired,
          ]}
        >
          <View style={styles.rbLeft}>
            <View style={styles.ldot} />
            <Text style={styles.rbText}>
              Rate locked {'\u00B7'}{' '}
              <Text style={styles.rbRate}>
                {symbol}
                {rate.toLocaleString()}/USDT
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.rbTimer,
              timerWarn && styles.rbTimerWarn,
              timerExpired && styles.rbTimerExpired,
            ]}
          >
            <Text
              style={[
                styles.rbTimerText,
                timerWarn && styles.rbTimerTextWarn,
                timerExpired && styles.rbTimerTextExpired,
              ]}
            >
              {formatTimer()}
            </Text>
          </View>
        </View>

        {/* Recipient strip */}
        <View style={styles.recipStrip}>
          <GradientAvatar
            initials={recipientInitials}
            size={34}
            colors={recipientColors}
            fontSize={11}
          />
          <View style={styles.rsInfo}>
            <Text style={styles.rsName}>{recipientName}</Text>
            <Text style={styles.rsSub}>
              {recipientMethod} {'\u00B7'} Nigeria {'\u00B7'} No Qupay account needed
            </Text>
          </View>
          <View style={styles.vtag}>
            <Ionicons name="checkmark" size={10} color="#00E5A0" />
            <Text style={styles.vtagText}>Verified</Text>
          </View>
        </View>

        {/* Amount card */}
        <View style={styles.amountCard}>
          <View style={styles.acSend}>
            <Text style={styles.acLabel}>You send</Text>
            <View style={styles.acRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,245,0.4)"
              />
              <View style={styles.currPill}>
                <Text style={styles.currIcon}>{'\u{1FA99}'}</Text>
                <Text style={styles.currText}>USDT</Text>
              </View>
            </View>
          </View>
          <View style={styles.rateDivider}>
            <View style={styles.rateLine} />
            <View style={styles.ratePill}>
              <Text style={styles.ratePillText}>
                1 USDT = {symbol}
                {rate.toLocaleString()}
              </Text>
            </View>
            <View style={styles.rateLine} />
          </View>
          <View style={styles.acRecv}>
            <Text style={styles.acLabel}>They receive</Text>
            <View style={styles.acRow}>
              <Text style={styles.recvInput}>
                {receiveAmount.toLocaleString()}
              </Text>
              <View style={styles.currPill}>
                <Text style={styles.currIcon}>{recipientFlag}</Text>
                <Text style={styles.currText}>{destCode}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fee note */}
        <View style={styles.feeNote}>
          <Text style={styles.feeLeft}>Fee included</Text>
          <Text style={styles.feeRight}>
            {symbol}
            {fee.toLocaleString()}{' '}
            <Text style={styles.feePct}>{feePct}%</Text>
          </Text>
        </View>

        {/* Wallet bar */}
        <TouchableOpacity style={styles.walletBar} activeOpacity={0.7}>
          <View style={styles.wbIcon}>
            <Text style={styles.wbIconText}>{'\u{1F98A}'}</Text>
          </View>
          <View style={styles.wbInfo}>
            <Text style={styles.wbName}>MetaMask</Text>
            <Text style={styles.wbSub}>0x3f9a\u2026b812 {'\u00B7'} 240 USDT</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.6)" />
        </TouchableOpacity>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <CTAButton
            title="Review & Send"
            onPress={() => setShowApproveSheet(true)}
            disabled={numAmount <= 0}
          />
        </View>
      </ScrollView>

      {/* Approve Sheet */}
      <BottomSheet
        visible={showApproveSheet}
        onClose={() => setShowApproveSheet(false)}
      >
        <View style={styles.asSummary}>
          <Text style={styles.asSending}>You're sending</Text>
          <Text style={styles.asAmount}>{numAmount} USDT</Text>
          <Text style={styles.asRecv}>
            {recipientName.split(' ')[0]} gets {symbol}
            {receiveAmount.toLocaleString()}
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>
              {'\u{1F4B0}'} Saving {symbol}22,000 vs Western Union
            </Text>
          </View>
        </View>
        <View style={styles.asDetails}>
          <AsRow label="To" value={`${recipientName} \u00B7 ${recipientMethod} \u00B7 Nigeria`} />
          <AsRow label="Rate" value={`${symbol}${rate.toLocaleString()}/USDT`} />
          <AsRow label="Fee" value={`${symbol}${fee.toLocaleString()} (${feePct}%)`} />
          <AsRow label="From" value="MetaMask \u00B7 0x3f9a\u2026b812" />
          <AsRow label="Network" value="Polygon \u00B7 ~$0.02 gas" />
          <AsRow label="Estimated delivery" value="~2 minutes" green isLast />
        </View>
        <View style={styles.sheetBtns}>
          <CTAButton
            title="Approve & Send"
            onPress={handleApprove}
            loading={approving}
          />
          <CTAButton
            title="Cancel"
            onPress={() => setShowApproveSheet(false)}
            ghost
            style={styles.cancelBtn}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const AsRow: React.FC<{
  label: string;
  value: string;
  green?: boolean;
  isLast?: boolean;
}> = ({ label, value, green, isLast }) => (
  <View style={[styles.asdRow, isLast && styles.asdRowLast]}>
    <Text style={styles.asdLeft}>{label}</Text>
    <Text style={[styles.asdRight, green && styles.asdRightGreen]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  // Rate bar
  rateBar: {
    marginHorizontal: 24,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,229,160,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.15)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  rateBarWarn: {
    borderColor: 'rgba(255,212,96,0.3)',
    backgroundColor: 'rgba(255,212,96,0.1)',
  },
  rateBarExpired: {
    borderColor: 'rgba(255,77,106,0.3)',
    backgroundColor: 'rgba(255,77,106,0.1)',
  },
  rbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ldot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E5A0',
  },
  rbText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  rbRate: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#00E5A0',
    fontVariant: ['tabular-nums'],
  },
  rbTimer: {
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  rbTimerWarn: { backgroundColor: 'rgba(255,212,96,0.1)' },
  rbTimerExpired: { backgroundColor: 'rgba(255,77,106,0.1)' },
  rbTimerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#00E5A0',
    fontVariant: ['tabular-nums'],
  },
  rbTimerTextWarn: { color: '#FFD460' },
  rbTimerTextExpired: { color: '#FF4D6A' },
  // Recipient strip
  recipStrip: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
  },
  rsInfo: { flex: 1 },
  rsName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  rsSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  vtag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,229,160,0.12)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  vtagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#00E5A0',
  },
  // Amount card
  amountCard: {
    marginHorizontal: 24,
    marginBottom: 14,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  acSend: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  acLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 8,
  },
  acRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 38,
    color: '#FFFFF5',
  },
  recvInput: {
    flex: 1,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 38,
    color: '#00E5A0',
  },
  currPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A42',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  currIcon: { fontSize: 14 },
  currText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  rateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  rateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,245,0.08)',
  },
  ratePill: {
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.25)',
    borderRadius: 24,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  ratePillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#00E5A0',
    fontVariant: ['tabular-nums'],
  },
  acRecv: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#2A2A42',
  },
  // Fee
  feeNote: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLeft: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  feeRight: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FFFFF5',
    fontVariant: ['tabular-nums'],
  },
  feePct: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#00E5A0',
  },
  // Wallet bar
  walletBar: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
  },
  wbIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,165,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wbIconText: { fontSize: 16 },
  wbInfo: { flex: 1 },
  wbName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  wbSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Approve sheet
  asSummary: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  asSending: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 6,
  },
  asAmount: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 40,
    letterSpacing: -1.5,
    color: '#FFFFF5',
    marginBottom: 4,
  },
  asRecv: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#00E5A0',
    marginBottom: 16,
  },
  saveBadge: {
    backgroundColor: 'rgba(0,229,160,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  saveBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#00E5A0',
  },
  asDetails: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  asdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  asdRowLast: { borderBottomWidth: 0 },
  asdLeft: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
  },
  asdRight: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#FFFFF5',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  asdRightGreen: {
    color: '#00E5A0',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  sheetBtns: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 10,
  },
  cancelBtn: {
    marginTop: 0,
  },
});

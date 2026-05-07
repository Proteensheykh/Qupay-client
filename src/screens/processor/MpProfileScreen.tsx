import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader, StatusBadge } from '../../components';
import { useUser } from '../../hooks/useUser';
import { useMpProfile, useToggleMpStatus } from '../../hooks/useMpProfile';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import type { LocalTime } from '../../api/mp';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'MpProfile'>;

function formatLocalTime(lt: LocalTime | null): string {
  if (!lt) return '—';
  return `${String(lt.hour).padStart(2, '0')}:${String(lt.minute).padStart(2, '0')}`;
}

const BADGE_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
};

export const MpProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const { data: mpProfile, isLoading } = useMpProfile();
  const toggleStatus = useToggleMpStatus();
  const toast = useToast();

  const isOnline = mpProfile?.status === 'ONLINE';
  const isSuspended = mpProfile?.status === 'SUSPENDED';

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

  if (isLoading || !mpProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
        <ScreenHeader title="Processor Profile" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <Text style={[styles.loadingText, { color: palette.grey[500] }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      <ScreenHeader title="Processor Profile" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Badge */}
        <View style={styles.statusSection}>
          <StatusBadge
            label={mpProfile.status}
            variant={isOnline ? 'success' : isSuspended ? 'error' : 'warning'}
          />
          {mpProfile.badgeLevel && (
            <View style={[styles.badgePill, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
              <Ionicons name="shield-checkmark" size={14} color={BADGE_COLORS[mpProfile.badgeLevel] ?? palette.grey[400]} />
              <Text style={[styles.badgeText, { color: BADGE_COLORS[mpProfile.badgeLevel] ?? palette.grey[400] }]}>
                {mpProfile.badgeLevel}
              </Text>
            </View>
          )}
        </View>

        {/* Balances */}
        <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={16} color={palette.royal[500]} />
            <Text style={[styles.cardHeaderText, { color: palette.grey[300] }]}>Balances</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: palette.grey[500] }]}>USDT</Text>
              <Text style={[styles.balanceValue, { color: palette.grey[100] }]}>
                {mpProfile.usdtBalance?.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: palette.material.lightThin }]} />
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: palette.grey[500] }]}>NGN</Text>
              <Text style={[styles.balanceValue, { color: palette.grey[100] }]}>
                {mpProfile.ngnBalance?.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={[styles.stakeRow, { borderTopColor: palette.material.lightThin }]}>
            <Text style={[styles.stakeLabel, { color: palette.grey[500] }]}>Staked USDT</Text>
            <Text style={[styles.stakeValue, { color: palette.royal[400] }]}>
              {mpProfile.stakedUsdt?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.limitRow}>
            <Text style={[styles.stakeLabel, { color: palette.grey[500] }]}>Daily Limit</Text>
            <Text style={[styles.stakeValue, { color: palette.grey[300] }]}>
              {mpProfile.dailyLimit?.toLocaleString()} USDT
            </Text>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={16} color={palette.royal[500]} />
            <Text style={[styles.cardHeaderText, { color: palette.grey[300] }]}>Operating Hours</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={[styles.hoursValue, { color: palette.grey[200] }]}>
              {formatLocalTime(mpProfile.operatingHoursStart)} — {formatLocalTime(mpProfile.operatingHoursEnd)}
            </Text>
          </View>
          <Text style={[styles.hoursNote, { color: palette.grey[600] }]}>
            Contact support to change operating hours
          </Text>
        </View>

        {/* Bindings */}
        <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={16} color={palette.royal[500]} />
            <Text style={[styles.cardHeaderText, { color: palette.grey[300] }]}>Linked Accounts</Text>
          </View>
          {user?.walletAddress && (
            <View style={styles.bindingRow}>
              <Ionicons name="wallet-outline" size={16} color={palette.grey[400]} />
              <View style={styles.bindingBody}>
                <Text style={[styles.bindingLabel, { color: palette.grey[500] }]}>Solana Wallet</Text>
                <Text style={[styles.bindingMono, { color: palette.grey[300] }]} numberOfLines={1}>
                  {user.walletAddress}
                </Text>
              </View>
            </View>
          )}
          {user?.bankAccounts?.map((ba, idx) => (
            <View key={idx} style={styles.bindingRow}>
              <Ionicons name="business-outline" size={16} color={palette.grey[400]} />
              <View style={styles.bindingBody}>
                <Text style={[styles.bindingLabel, { color: palette.grey[500] }]}>Bank Account</Text>
                <Text style={[styles.bindingValue, { color: palette.grey[300] }]}>
                  {ba.accountName} ({ba.bankName})
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.bodySm },
  statusSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderText: { ...typography.h4 },
  balanceRow: { flexDirection: 'row', marginBottom: 12 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { ...typography.label, marginBottom: 4 },
  balanceValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, fontVariant: ['tabular-nums'] },
  balanceDivider: { width: 1 },
  stakeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, marginBottom: 4 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stakeLabel: { ...typography.subheader2 },
  stakeValue: { fontFamily: 'Inter_700Bold', fontSize: 14, fontVariant: ['tabular-nums'] },
  hoursRow: { marginBottom: 8 },
  hoursValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  hoursNote: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  bindingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bindingBody: { flex: 1 },
  bindingLabel: { ...typography.label, marginBottom: 2 },
  bindingValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  bindingMono: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '../../components/Icon';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/AppNavigator';
import { QupayLogo, Avatar, CTAButton } from '../../components';
import { userProfile } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useTheme, ThemePreference } from '../../theme';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface Props {
  navigation?: ProfileScreenNavigationProp;
}

const PREFERENCE_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const PREFERENCE_CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [notifOn, setNotifOn] = useState(true);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { theme, mode, preference, setPreference, gradient } = useTheme();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const cycleTheme = useCallback(() => {
    const currentIndex = PREFERENCE_CYCLE.indexOf(preference);
    const nextIndex = (currentIndex + 1) % PREFERENCE_CYCLE.length;
    setPreference(PREFERENCE_CYCLE[nextIndex]);
  }, [preference, setPreference]);

  const displayName = user ? `${user.firstName} ${user.lastName}` : userProfile.name;
  const displayEmail = user?.email || userProfile.email;
  const displayPhone = user?.phoneNumber || userProfile.phone;
  const isProcessor = user?.role === 'BOTH' || user?.role === 'MP';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <QupayLogo size={22} />
        </View>

        {/* Profile hero */}
        <View style={[styles.heroWrap, { borderColor: theme.info.bg }]}>
          <LinearGradient
            colors={gradient.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.phTop}>
              <Avatar seed={displayName} size={60} />
              <View style={styles.phInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.phName, { color: theme.text.primary }]}>{displayName}</Text>
                  {isProcessor && (
                    <View style={[styles.processorBadge, { backgroundColor: theme.info.bg, borderColor: theme.secondary.main }]}>
                      <Ionicons name="swap-horizontal" size={10} color={theme.secondary.main} />
                      <Text style={[styles.processorBadgeText, { color: theme.secondary.main }]}>Processor</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.phEmail, { color: theme.text.secondary }]}>{displayEmail}</Text>
                <Text style={[styles.phPhone, { color: theme.text.muted }]}>{displayPhone}</Text>
              </View>
            </View>
            <View style={[styles.phStats, { borderTopColor: theme.divider }]}>
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: theme.text.primary }]}>{userProfile.totalTransfers}</Text>
                <Text style={[styles.phLabel, { color: theme.text.secondary }]}>Transfers</Text>
              </View>
              <View style={[styles.phStatDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: theme.secondary.main }]}>${userProfile.totalSent.toLocaleString()}</Text>
                <Text style={[styles.phLabel, { color: theme.text.secondary }]}>Total Sent</Text>
              </View>
              <View style={[styles.phStatDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: theme.text.primary }]}>Nov '25</Text>
                <Text style={[styles.phLabel, { color: theme.text.secondary }]}>Member</Text>
              </View>
            </View>

            {user?.role === 'PAYER' && (
              <TouchableOpacity
                style={[styles.heroPromo, { borderTopColor: theme.divider }]}
                onPress={() => navigation?.navigate('ProcessorOnboarding')}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color={theme.secondary.main} />
                <Text style={[styles.heroPromoText, { color: theme.text.secondary }]}>Earn by settling transactions</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.text.muted} />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Settings</Text>
        <View style={[styles.card, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.inputBorder }]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: theme.info.bg }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.secondary.main} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Transaction PIN</Text>
              <Text style={[styles.rowSub, { color: theme.text.secondary }]}>Change your 4-digit PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.inputBorder }]}
            activeOpacity={0.7}
            onPress={cycleTheme}
          >
            <View style={[styles.rowIcon, { backgroundColor: mode === 'dark' ? theme.background.surface2 : theme.background.surface }]}>
              <Ionicons
                name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
                size={18}
                color={theme.secondary.main}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Appearance</Text>
              <Text style={[styles.rowSub, { color: theme.text.secondary }]}>{PREFERENCE_LABELS[preference]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
          </TouchableOpacity>

          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.warning.bg }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.warning.main} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: theme.text.secondary }]}>Push {'\u00B7'} SMS</Text>
            </View>
            <TouchableOpacity
              onPress={() => setNotifOn(!notifOn)}
              style={[
                styles.toggle,
                { backgroundColor: notifOn ? theme.secondary.main : theme.background.surface2 }
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.toggleThumb,
                { backgroundColor: theme.background.default },
                notifOn && styles.toggleThumbOn
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Support</Text>
        <View style={[styles.card, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
          <TouchableOpacity style={[styles.row, styles.rowLast]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: theme.background.surface2 }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.text.secondary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Help & Support</Text>
              <Text style={[styles.rowSub, { color: theme.text.secondary }]}>Avg. response &lt;3 mins</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <CTAButton
          title="Log Out"
          onPress={handleLogout}
          danger
          style={styles.logoutBtn}
        />

        <Text style={[styles.versionText, { color: theme.text.disabled }]}>Qupay v1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 4,
  },
  heroWrap: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hero: { padding: 22 },
  phTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  phInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  phName: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 19,
    letterSpacing: -0.3,
  },
  processorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  processorBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  phPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  phStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  heroPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  heroPromoText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  phStat: { flex: 1, alignItems: 'center' },
  phStatDivider: {
    width: 1,
  },
  phVal: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 17,
  },
  phLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 24,
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  rowSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 4,
  },
  versionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

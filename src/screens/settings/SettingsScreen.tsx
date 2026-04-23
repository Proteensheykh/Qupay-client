import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/AppNavigator';
import { QupayLogo, Avatar, CTAButton } from '../../components';
import { userProfile } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';
import { useTheme, ThemePreference } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
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
  const { mode, preference, setPreference } = useTheme();
  const backdrop = palette.grey[900];
  const cardBg = palette.grey[800];
  const hairline = palette.material.lightThin;

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
    <SafeAreaView style={[styles.safe, { backgroundColor: backdrop }]} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <QupayLogo size={22} />
        </View>

        {/* Profile hero */}
        <View
          style={[
            styles.heroWrap,
            { backgroundColor: cardBg },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <View style={styles.hero}>
            <View style={styles.phTop}>
              <Avatar seed={displayName} size={60} />
              <View style={styles.phInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.phName, { color: palette.grey[300] }]}>{displayName}</Text>
                  {isProcessor && (
                    <View
                      style={[
                        styles.processorBadge,
                        { backgroundColor: 'rgba(158,121,210,0.15)', borderColor: palette.royal[500] },
                      ]}
                    >
                      <Ionicons name="swap-horizontal" size={10} color={palette.royal[400]} />
                      <Text style={[styles.processorBadgeText, { color: palette.royal[400] }]}>Processor</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.phEmail, { color: palette.grey[500] }]}>{displayEmail}</Text>
                <Text style={[styles.phPhone, { color: palette.grey[600] }]}>{displayPhone}</Text>
              </View>
            </View>
            <View style={[styles.phStats, { borderTopColor: hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: palette.grey[300] }]}>{userProfile.totalTransfers}</Text>
                <Text style={[styles.phLabel, { color: palette.grey[500] }]}>Transfers</Text>
              </View>
              <View style={[styles.phStatDivider, { backgroundColor: hairline }]} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: palette.royal[400] }]}>${userProfile.totalSent.toLocaleString()}</Text>
                <Text style={[styles.phLabel, { color: palette.grey[500] }]}>Total Sent</Text>
              </View>
              <View style={[styles.phStatDivider, { backgroundColor: hairline }]} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, { color: palette.grey[300] }]}>Nov '25</Text>
                <Text style={[styles.phLabel, { color: palette.grey[500] }]}>Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Settings</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: hairline },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <TouchableOpacity style={[styles.row, { borderBottomColor: hairline }]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.royal[400]} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.grey[300] }]}>Transaction PIN</Text>
              <Text style={[styles.rowSub, { color: palette.grey[500] }]}>Change your 4-digit PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.grey[600]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: hairline }]}
            activeOpacity={0.7}
            onPress={cycleTheme}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.grey[900] }]}>
              <Ionicons
                name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
                size={18}
                color={palette.royal[400]}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.grey[300] }]}>Appearance</Text>
              <Text style={[styles.rowSub, { color: palette.grey[500] }]}>{PREFERENCE_LABELS[preference]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.grey[600]} />
          </TouchableOpacity>

          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(243,175,37,0.12)' }]}>
              <Ionicons name="notifications-outline" size={18} color={palette.status.partial} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.grey[300] }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: palette.grey[500] }]}>Push {'\u00B7'} SMS</Text>
            </View>
            <TouchableOpacity
              onPress={() => setNotifOn(!notifOn)}
              style={[
                styles.toggle,
                { backgroundColor: notifOn ? palette.royal[500] : palette.grey[700] },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: backdrop },
                  notifOn && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: palette.grey[500] }]}>Support</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: hairline },
            borders.hairline.dark,
            { borderRadius: radii.lg },
          ]}
        >
          <TouchableOpacity style={[styles.row, styles.rowLast]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: palette.grey[900] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.grey[500]} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.grey[300] }]}>Help & Support</Text>
              <Text style={[styles.rowSub, { color: palette.grey[500] }]}>Avg. response &lt;3 mins</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.grey[600]} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <CTAButton
          title="Log Out"
          onPress={handleLogout}
          danger
          style={styles.logoutBtn}
        />

        <Text style={[styles.versionText, { color: palette.grey[600] }]}>Qupay v1.0.0</Text>
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
    overflow: 'hidden',
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
    paddingTop: 14,
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
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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

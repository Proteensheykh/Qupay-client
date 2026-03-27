import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { QupayLogo, GradientAvatar, CTAButton } from '../../components';
import { userProfile } from '../../data/mockData';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [notifOn, setNotifOn] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <QupayLogo size={22} />
        </View>

        {/* Profile hero */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#1A1A2E', '#111118']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.phTop}>
              <GradientAvatar
                initials={userProfile.initials}
                size={60}
                borderWidth={2}
                borderColor="rgba(255,255,255,0.1)"
                fontSize={20}
              />
              <View style={styles.phInfo}>
                <Text style={styles.phName}>{userProfile.name}</Text>
                <Text style={styles.phEmail}>{userProfile.email}</Text>
                <Text style={styles.phPhone}>{userProfile.phone}</Text>
              </View>
            </View>
            <View style={styles.phStats}>
              <View style={styles.phStat}>
                <Text style={styles.phVal}>{userProfile.totalTransfers}</Text>
                <Text style={styles.phLabel}>Transfers</Text>
              </View>
              <View style={styles.phStatDivider} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, styles.phValGreen]}>${userProfile.totalSent.toLocaleString()}</Text>
                <Text style={styles.phLabel}>Total Sent</Text>
              </View>
              <View style={styles.phStatDivider} />
              <View style={styles.phStat}>
                <Text style={styles.phVal}>Nov '25</Text>
                <Text style={styles.phLabel}>Member</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,229,160,0.07)' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#00E5A0" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Transaction PIN</Text>
              <Text style={styles.rowSub}>Change your 4-digit PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
          </TouchableOpacity>

          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,212,96,0.1)' }]}>
              <Ionicons name="notifications-outline" size={18} color="#FFD460" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Notifications</Text>
              <Text style={styles.rowSub}>Push {'\u00B7'} SMS</Text>
            </View>
            <Switch
              value={notifOn}
              onValueChange={setNotifOn}
              trackColor={{ false: '#2A2A42', true: '#00E5A0' }}
              thumbColor="#fff"
              ios_backgroundColor="#2A2A42"
            />
          </View>
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.rowLast]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#2A2A42' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="rgba(255,255,245,0.6)" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Help & Support</Text>
              <Text style={styles.rowSub}>Avg. response &lt;3 mins</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <CTAButton
          title="Log Out"
          onPress={() => {}}
          danger
          style={styles.logoutBtn}
        />

        <Text style={styles.versionText}>Qupay v1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
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
    borderColor: 'rgba(0,229,160,0.12)',
  },
  hero: { padding: 22 },
  phTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  phInfo: { flex: 1 },
  phName: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 19,
    letterSpacing: -0.3,
    color: '#FFFFF5',
  },
  phEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 2,
  },
  phPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.4)',
    marginTop: 1,
  },
  phStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,245,0.06)',
    paddingTop: 14,
  },
  phStat: { flex: 1, alignItems: 'center' },
  phStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,245,0.06)',
  },
  phVal: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 17,
    color: '#FFFFF5',
  },
  phValGreen: { color: '#00E5A0' },
  phLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,245,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginHorizontal: 24,
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
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
    borderBottomColor: 'rgba(255,255,245,0.08)',
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
    color: '#FFFFF5',
  },
  rowSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 1,
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 4,
  },
  versionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.2)',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

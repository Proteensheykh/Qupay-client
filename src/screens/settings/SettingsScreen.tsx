import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { QupayLogo, GradientAvatar, CTAButton, BottomSheet } from '../../components';
import { userProfile } from '../../data/mockData';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [notifOn, setNotifOn] = useState(true);
  const [showCorridorSheet, setShowCorridorSheet] = useState(false);

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
                <Text style={styles.phName}>Raj Arumugam</Text>
                <Text style={styles.phPhone}>{userProfile.phone}</Text>
                <Text style={styles.phReg}>
                  {userProfile.flag} {userProfile.country} {'\u00B7'} MAS regulated
                </Text>
              </View>
            </View>
            <View style={styles.phStats}>
              <View style={styles.phStat}>
                <Text style={styles.phVal}>6</Text>
                <Text style={styles.phLabel}>Transfers</Text>
              </View>
              <View style={styles.phStatDivider} />
              <View style={styles.phStat}>
                <Text style={[styles.phVal, styles.phValGreen]}>{'\u20A6'}22k</Text>
                <Text style={styles.phLabel}>Saved</Text>
              </View>
              <View style={styles.phStatDivider} />
              <View style={styles.phStat}>
                <Text style={styles.phVal}>Mar '24</Text>
                <Text style={styles.phLabel}>Member</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Account section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowCorridorSheet(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,229,160,0.07)' }]}>
              <Text style={styles.rowIconEmoji}>{'\u{1F30D}'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Sending Corridor</Text>
              <Text style={styles.rowSub}>
                {'\u{1F1F8}\u{1F1EC}'} Singapore {'\u2192'} {'\u{1F1F3}\u{1F1EC}'} Nigeria
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,77,106,0.1)' }]}>
              <Text style={styles.rowIconEmoji}>{'\u{1F510}'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Security</Text>
              <Text style={styles.rowSub}>PIN {'\u00B7'} Biometrics active</Text>
            </View>
            <View style={styles.rowRight}>
              <View style={styles.strongBadge}>
                <Text style={styles.strongBadgeText}>Strong</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
            </View>
          </TouchableOpacity>

          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,212,96,0.1)' }]}>
              <Text style={styles.rowIconEmoji}>{'\u{1F514}'}</Text>
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

        {/* Support section */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.rowLast]} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#2A2A42' }]}>
              <Text style={styles.rowIconEmoji}>{'\u{1F4AC}'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Help & Support</Text>
              <Text style={styles.rowSub}>Avg. response &lt;3 mins</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,245,0.4)" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.masText}>MAS Licensed {'\u00B7'} Global regulated network</Text>

        {/* Log Out */}
        <CTAButton
          title="Log Out"
          onPress={() => {}}
          danger
          style={styles.logoutBtn}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomSheet
        visible={showCorridorSheet}
        onClose={() => setShowCorridorSheet(false)}
        title="Sending Corridor"
      >
        <Text style={styles.cpNote}>Select your destination country</Text>
        {[
          { flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria', rate: '\u20A61,645/USDT' },
          { flag: '\u{1F1EC}\u{1F1ED}', name: 'Ghana', rate: '\u20B513.8/USDT' },
          { flag: '\u{1F1F0}\u{1F1EA}', name: 'Kenya', rate: 'KSh143/USDT' },
        ].map((d) => (
          <TouchableOpacity
            key={d.name}
            style={styles.cpItem}
            onPress={() => setShowCorridorSheet(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cpFlag}>{d.flag}</Text>
            <View style={styles.cpInfo}>
              <Text style={styles.cpName}>{d.name}</Text>
              <Text style={styles.cpRate}>{d.rate}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

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
  phPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 2,
  },
  phReg: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,245,0.4)',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
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
  rowIconEmoji: { fontSize: 18 },
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
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strongBadge: {
    backgroundColor: 'rgba(0,229,160,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  strongBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#00E5A0',
  },
  masText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.4)',
    textAlign: 'center',
    paddingVertical: 8,
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 4,
  },
  // Corridor picker
  cpNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.08)',
  },
  cpFlag: { fontSize: 24, width: 32, textAlign: 'center' },
  cpInfo: { flex: 1 },
  cpName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFF5',
  },
  cpRate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
});

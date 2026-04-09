import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '../../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { QupayLogo, Avatar, BottomSheet } from '../../components';
import { shadows } from '../../theme/spacing';
import { useTheme, colors } from '../../theme';
import { userProfile } from '../../data/mockData';

type Props = { navigation: any };

export interface DestInfo {
  flag: string;
  name: string;
  code: string;
  symbol: string;
  rate: number;
  providers: string;
}

const destinationList: DestInfo[] = [
  { flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria', code: 'NGN', symbol: '\u20A6', rate: 1645, providers: 'OPay \u00B7 GTBank \u00B7 PalmPay \u00B7 Kuda' },
  { flag: '\u{1F1EC}\u{1F1ED}', name: 'Ghana', code: 'GHS', symbol: '\u20B5', rate: 13.8, providers: 'MTN Momo \u00B7 Vodafone Cash \u00B7 AirtelTigo' },
  { flag: '\u{1F1F0}\u{1F1EA}', name: 'Kenya', code: 'KES', symbol: 'KSh', rate: 143, providers: 'M-Pesa \u00B7 Airtel Money \u00B7 Bank' },
  { flag: '\u{1F1F5}\u{1F1ED}', name: 'Philippines', code: 'PHP', symbol: '\u20B1', rate: 58.5, providers: 'GCash \u00B7 Maya \u00B7 Bank' },
  { flag: '\u{1F1EE}\u{1F1F3}', name: 'India', code: 'INR', symbol: '\u20B9', rate: 83.2, providers: 'UPI \u00B7 Bank transfer' },
  { flag: '\u{1F1F5}\u{1F1F0}', name: 'Pakistan', code: 'PKR', symbol: '\u20A8', rate: 278, providers: 'EasyPaisa \u00B7 JazzCash \u00B7 Bank' },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, gradient } = useTheme();
  const [selectedDest, setSelectedDest] = useState(destinationList[0]);
  const [showCorridorSheet, setShowCorridorSheet] = useState(false);

  const recentContacts = useMemo(
    () => [
      { name: 'Emeka', initials: 'EJ', fullName: 'Emeka Johnson', colors: ['#1a6fff', theme.secondary.main] as [string, string], method: 'OPay', phone: '0812 456 7890', flag: '\u{1F1F3}\u{1F1EC}', amount: 200 },
      { name: 'Adaeze', initials: 'AO', fullName: 'Adaeze Obi', colors: ['#a855f7', '#1a6fff'] as [string, string], method: 'GTBank', phone: '\u00B7\u00B7\u00B7\u00B7 4521', flag: '\u{1F1F3}\u{1F1EC}', amount: 100 },
      { name: 'Kofi', initials: 'KM', fullName: 'Kofi Mensah', colors: ['#ff9f43', theme.secondary.main] as [string, string], method: 'MTN Momo', phone: '0541 234 567', flag: '\u{1F1EC}\u{1F1ED}', amount: 50 },
      { name: 'Chidi', initials: 'CN', fullName: 'Chidi Nwosu', colors: [theme.error.light, theme.warning.main] as [string, string], method: 'PalmPay', phone: '0813 456 7890', flag: '\u{1F1F3}\u{1F1EC}', amount: 30 },
    ],
    [theme.secondary.main, theme.error.light, theme.warning.main]
  );

  const greeting = useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <QupayLogo size={22} />
          <TouchableOpacity
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) parent.navigate('ProfileTab');
            }}
            activeOpacity={0.8}
          >
            <Avatar seed={userProfile.name} size={38} />
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={[styles.heroWrap, { borderColor: colors.brand.blueDim }]}>
          <LinearGradient
            colors={[...gradient.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={[styles.heroName, { color: theme.text.primary }]}>
              {greeting()}, {userProfile.name} {'\u{1F44B}'}
            </Text>
            <TouchableOpacity
              style={[
                styles.corridorBtn,
                {
                  backgroundColor: colors.brand.purpleDim2,
                  borderColor: colors.brand.blueDim,
                },
              ]}
              onPress={() => setShowCorridorSheet(true)}
              activeOpacity={0.7}
            >
              <View style={styles.corridorFlags}>
                <Text style={styles.flagText}>{'\u{1F1F8}\u{1F1EC}'}</Text>
                <Text style={[styles.arrowGreen, { color: theme.secondary.main }]}>{'\u2192'}</Text>
                <Text style={styles.flagText}>{selectedDest.flag}</Text>
              </View>
              <Text style={[styles.corridorName, { color: theme.text.secondary }]}>
                Singapore {'\u2192'} {selectedDest.name}
              </Text>
              <Text style={[styles.cbRate, { color: theme.secondary.main }]}>
                {selectedDest.symbol}
                {selectedDest.rate.toLocaleString()}/USDT
              </Text>
              <Text style={[styles.tapText, { color: theme.text.muted }]}>tap to change</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Send Money button */}
        <TouchableOpacity
          style={[styles.sendBtn, shadows.ctaGlow, { backgroundColor: theme.secondary.main }]}
          onPress={() => {
            const rootNav = navigation.getParent()?.getParent();
            if (rootNav) {
              rootNav.navigate('SendFlow' as never, {
                screen: 'Recipient',
                params: { dest: selectedDest },
              } as never);
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-forward" size={20} color={theme.background.default} />
          <Text style={[styles.sendBtnText, { color: theme.background.default }]}>Send Money</Text>
        </TouchableOpacity>

        {/* Send again */}
        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Send again</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentsScroll}
        >
          {recentContacts.map((c) => (
            <TouchableOpacity
              key={c.initials}
              style={styles.recentItem}
              onPress={() => {
                const rootNav = navigation.getParent()?.getParent();
                if (rootNav) {
                  rootNav.navigate('SendFlow' as never, {
                    screen: 'Amount',
                    params: {
                      recipientName: c.fullName,
                      recipientInitials: c.initials,
                      recipientColors: c.colors,
                      recipientMethod: c.method,
                      recipientPhone: c.phone,
                      recipientFlag: c.flag,
                      lastAmount: c.amount,
                      dest: selectedDest,
                    },
                  } as never);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.avRing, { borderColor: theme.inputBorder }]}>
                <Avatar seed={c.fullName} size={46} />
              </View>
              <Text style={[styles.recentName, { color: theme.text.secondary }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Corridor picker sheet */}
      <BottomSheet
        visible={showCorridorSheet}
        onClose={() => setShowCorridorSheet(false)}
        title="Send to"
      >
        <Text style={[styles.corrFromLabel, { color: theme.text.secondary }]}>
          From{' '}
          <Text style={[styles.corrFromVal, { color: theme.text.primary }]}>
            Singapore {'\u{1F1F8}\u{1F1EC}'}
          </Text>
        </Text>
        {destinationList.map((d) => (
          <TouchableOpacity
            key={d.name}
            style={[
              styles.cpItem,
              { borderBottomColor: theme.inputBorder },
              selectedDest.name === d.name && { backgroundColor: colors.brand.blueDim },
            ]}
            onPress={() => {
              setSelectedDest(d);
              setShowCorridorSheet(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cpFlag}>{d.flag}</Text>
            <View style={styles.cpInfo}>
              <Text style={[styles.cpName, { color: theme.text.primary }]}>{d.name}</Text>
              <Text style={[styles.cpSub, { color: theme.text.secondary }]}>
                {d.symbol}
                {d.rate.toLocaleString()}/USDT {'\u00B7'} {d.providers}
              </Text>
            </View>
            {selectedDest.name === d.name && (
              <Text style={[styles.cpCheck, { color: theme.secondary.main }]}>{'\u2713'}</Text>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>
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
    paddingBottom: 12,
  },
  heroWrap: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hero: {
    padding: 20,
  },
  heroName: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  corridorBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  corridorFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagText: { fontSize: 16 },
  arrowGreen: { fontSize: 14 },
  corridorName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  cbRate: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  tapText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  sendBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sendBtnText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 17,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 24,
    marginBottom: 10,
  },
  recentsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  recentItem: {
    alignItems: 'center',
    width: 60,
  },
  avRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  recentName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  corrFromLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  corrFromVal: {
    fontFamily: 'Inter_600SemiBold',
  },
  cpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  cpFlag: { fontSize: 24, width: 32, textAlign: 'center' },
  cpInfo: { flex: 1 },
  cpName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  cpSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  cpCheck: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});

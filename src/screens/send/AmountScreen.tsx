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
import { Ionicons } from '../../components/Icon';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ScreenHeader, CTAButton, BottomSheet } from '../../components';
import { useAuthStore } from '../../store/authStore';
import * as storage from '../../store/secureStorage';
import { StorageKeys } from '../../store/secureStorage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<SendFlowParamList, 'Amount'>;

const currencies = [
  { code: 'USDT', name: 'Tether', icon: '🪙', color: '#26A17B', symbol: '' },
  { code: 'NGN', name: 'Nigerian Naira', icon: '🇳🇬', color: '#008751', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', icon: '🇬🇭', color: '#CE1126', symbol: '₵' },
  { code: 'KES', name: 'Kenyan Shilling', icon: '🇰🇪', color: '#006600', symbol: 'KSh' },
  { code: 'INR', name: 'Indian Rupee', icon: '🇮🇳', color: '#FF9933', symbol: '₹' },
  { code: 'PHP', name: 'Philippine Peso', icon: '🇵🇭', color: '#0038A8', symbol: '₱' },
  { code: 'MXN', name: 'Mexican Peso', icon: '🇲🇽', color: '#006847', symbol: '$' },
  { code: 'PKR', name: 'Pakistani Rupee', icon: '🇵🇰', color: '#01411C', symbol: 'Rs' },
  { code: 'ZAR', name: 'South African Rand', icon: '🇿🇦', color: '#007749', symbol: 'R' },
];

const usdtRates: Record<string, number> = {
  USDT: 1, NGN: 1645, GHS: 15.16, KES: 128.7, INR: 83.5, PHP: 56.78, MXN: 17.24, PKR: 278.5, ZAR: 18.9,
};

const currencySymbols: Record<string, string> = {
  USDT: '', NGN: '₦', GHS: '₵', KES: 'KSh', INR: '₹', PHP: '₱', MXN: '$', PKR: 'Rs', ZAR: 'R',
};

const getRate = (from: string, to: string): number => {
  if (from === to) return 1;
  const fromToUsdt = 1 / (usdtRates[from] || 1);
  const usdtToTo = usdtRates[to] || 1;
  return fromToUsdt * usdtToTo;
};

const isCrypto = (code: string): boolean => code === 'USDT';

export const AmountScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedSendCurrency, setSelectedSendCurrency] = useState(currencies[0]);
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState(currencies[1]);
  const [showSendPicker, setShowSendPicker] = useState(false);
  const [showReceivePicker, setShowReceivePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [showProcessorPromo, setShowProcessorPromo] = useState(false);

  const handleAmountChange = useCallback((text: string) => {
    // Remove any non-numeric characters except decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Prevent leading zeros (except for "0." decimal)
    if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
      cleaned = cleaned.slice(1);
    }
    
    setAmount(cleaned);
  }, []);
  const rootNavigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const isPayer = user?.role === 'PAYER';

  useEffect(() => {
    if (isPayer) {
      storage.getItem(StorageKeys.PROCESSOR_PROMO_DISMISSED).then((value) => {
        if (value !== 'true') {
          setShowProcessorPromo(true);
        }
      });
    }
  }, [isPayer]);

  const dismissProcessorPromo = useCallback(async () => {
    setShowProcessorPromo(false);
    await storage.setItem(StorageKeys.PROCESSOR_PROMO_DISMISSED, 'true');
  }, []);

  const navigateToProcessorOnboarding = useCallback(() => {
    rootNavigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: {
          screen: 'ProfileTab',
          params: {
            screen: 'ProcessorOnboarding',
          },
        },
      })
    );
  }, [rootNavigation]);

  const rate = getRate(selectedSendCurrency.code, selectedReceiveCurrency.code);
  const numAmount = parseFloat(amount) || 0;
  const receivingCrypto = isCrypto(selectedReceiveCurrency.code);
  const receiveAmount = receivingCrypto
    ? parseFloat((numAmount * rate).toFixed(2))
    : Math.round(numAmount * rate);

  const handleContinue = () => {
    navigation.navigate('Recipient', {
      amount: numAmount,
      sendCurrency: selectedSendCurrency.code,
      receiveCurrency: selectedReceiveCurrency.code,
      receiveAmount,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScreenHeader title="Send" />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showProcessorPromo && (
          <TouchableOpacity
            style={[
              styles.promoBanner,
              {
                backgroundColor: theme.info.bg,
                borderColor: `${theme.secondary.main}33`,
              },
            ]}
            onPress={navigateToProcessorOnboarding}
            activeOpacity={0.8}
          >
            <View style={[styles.promoIconWrap, { backgroundColor: theme.info.bg }]}>
              <Ionicons name="swap-horizontal" size={16} color={theme.secondary.main} />
            </View>
            <View style={styles.promoTextWrap}>
              <Text style={[styles.promoTitle, { color: theme.secondary.main }]}>Earn with Qupay</Text>
              <Text style={[styles.promoSub, { color: theme.text.secondary }]}>Settle transactions as a Processor</Text>
            </View>
            <TouchableOpacity
              onPress={dismissProcessorPromo}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.promoDismiss}
            >
              <Ionicons name="close" size={16} color={theme.text.muted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: theme.background.surface,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View style={styles.acSection}>
            <Text style={[styles.acLabel, { color: theme.text.secondary }]}>You send</Text>
            <View style={styles.acRowSpaced}>
              <TextInput
                style={[styles.amountInput, { color: theme.text.primary }]}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.text.disabled}
                selectionColor={theme.secondary.main}
                cursorColor={theme.secondary.main}
                underlineColorAndroid="transparent"
                autoCorrect={false}
                autoCapitalize="none"
                inputMode="decimal"
              />
              <TouchableOpacity
                style={[
                  styles.sendCurrPill,
                  {
                    backgroundColor: theme.background.paper,
                    borderColor: `${theme.secondary.main}4D`,
                  },
                ]}
                onPress={() => setShowSendPicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.cpIconWrapSmall, { backgroundColor: selectedSendCurrency.color + '20' }]}>
                  <Text style={styles.currFlagIcon}>{selectedSendCurrency.icon}</Text>
                </View>
                <Text style={[styles.currText, { color: theme.text.primary }]}>{selectedSendCurrency.code}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rateDivider}>
            <View style={[styles.rateLine, { backgroundColor: theme.inputBorder }]} />
            <View
              style={[
                styles.ratePill,
                {
                  backgroundColor: theme.background.default,
                  borderColor: `${theme.secondary.main}40`,
                },
              ]}
            >
              <Text style={[styles.ratePillText, { color: theme.secondary.main }]}>
                {receivingCrypto
                  ? `1 USDT = ${currencySymbols[selectedSendCurrency.code] || ''}${usdtRates[selectedSendCurrency.code]?.toLocaleString() || '1'} ${selectedSendCurrency.code}`
                  : `1 ${selectedSendCurrency.code} = ${selectedReceiveCurrency.symbol}${rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </Text>
            </View>
            <View style={[styles.rateLine, { backgroundColor: theme.inputBorder }]} />
          </View>

          <View style={[styles.acSectionRecv, { backgroundColor: theme.background.paper }]}>
            <Text style={[styles.acLabel, { color: theme.text.secondary }]}>They receive</Text>
            <View style={styles.acRowSpaced}>
              <Text style={[styles.recvAmount, { color: theme.secondary.main }]}>
                {numAmount > 0
                  ? receivingCrypto
                    ? receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : `${selectedReceiveCurrency.symbol}${receiveAmount.toLocaleString()}`
                  : '—'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.recvCurrPill,
                  {
                    backgroundColor: theme.background.surface2,
                    borderColor: `${theme.secondary.main}40`,
                  },
                ]}
                onPress={() => setShowReceivePicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.cpIconWrapSmall, { backgroundColor: selectedReceiveCurrency.color + '20' }]}>
                  <Text style={styles.currFlagIcon}>{selectedReceiveCurrency.icon}</Text>
                </View>
                <Text style={[styles.currText, { color: theme.text.primary }]}>{selectedReceiveCurrency.code}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <CTAButton
            title="Continue"
            onPress={handleContinue}
            disabled={numAmount <= 0}
          />
        </View>
      </ScrollView>

      <BottomSheet visible={showSendPicker} onClose={() => setShowSendPicker(false)} title="Send Currency">
        {currencies.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[
              styles.cpItem,
              { borderBottomColor: theme.inputBorder },
              selectedSendCurrency.code === c.code && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => { setSelectedSendCurrency(c); setShowSendPicker(false); }}
            activeOpacity={0.7}
          >
            <View style={[styles.cpIconWrap, { backgroundColor: c.color + '20' }]}>
              <Text style={styles.cpIcon}>{c.icon}</Text>
            </View>
            <View style={styles.cpInfo}>
              <Text style={[styles.cpName, { color: theme.text.primary }]}>{c.code}</Text>
              <Text style={[styles.cpSub, { color: theme.text.secondary }]}>{c.name}</Text>
            </View>
            {selectedSendCurrency.code === c.code && <Ionicons name="checkmark" size={18} color={theme.secondary.main} />}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </BottomSheet>

      <BottomSheet visible={showReceivePicker} onClose={() => setShowReceivePicker(false)} title="Receive Currency">
        {currencies.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[
              styles.cpItem,
              { borderBottomColor: theme.inputBorder },
              selectedReceiveCurrency.code === c.code && { backgroundColor: theme.info.bg },
            ]}
            onPress={() => { setSelectedReceiveCurrency(c); setShowReceivePicker(false); }}
            activeOpacity={0.7}
          >
            <View style={[styles.cpIconWrap, { backgroundColor: c.color + '20' }]}>
              <Text style={styles.cpIcon}>{c.icon}</Text>
            </View>
            <View style={styles.cpInfo}>
              <Text style={[styles.cpName, { color: theme.text.primary }]}>{c.code}</Text>
              <Text style={[styles.cpSub, { color: theme.text.secondary }]}>{c.name}</Text>
            </View>
            {selectedReceiveCurrency.code === c.code && <Ionicons name="checkmark" size={18} color={theme.secondary.main} />}
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
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  promoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextWrap: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  promoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  promoDismiss: {
    padding: 4,
  },
  amountCard: {
    marginHorizontal: 24, marginTop: 8, marginBottom: 12,
    borderWidth: 1, borderRadius: 20, overflow: 'hidden',
  },
  acSection: { paddingVertical: 20, paddingHorizontal: 20 },
  acSectionRecv: { paddingVertical: 16, paddingHorizontal: 20, paddingBottom: 20 },
  acLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 8,
  },
  acRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    minWidth: 60,
    maxWidth: '55%',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    outlineStyle: 'none',
  } as any,
  recvAmount: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 32 },
  sendCurrPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5,
    borderRadius: 24, paddingVertical: 10, paddingHorizontal: 14,
    minWidth: 125,
  },
  recvCurrPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5,
    borderRadius: 24, paddingVertical: 8, paddingHorizontal: 12,
    minWidth: 125,
  },
  cpIconWrapSmall: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  currFlagIcon: { fontSize: 16 },
  currText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  rateDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  rateLine: { flex: 1, height: 1 },
  ratePill: {
    borderWidth: 1,
    borderRadius: 24, paddingVertical: 5, paddingHorizontal: 12,
  },
  ratePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, fontVariant: ['tabular-nums'] },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 24 },
  cpItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  cpIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cpIcon: { fontSize: 18 },
  cpInfo: { flex: 1 },
  cpName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  cpSub: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});

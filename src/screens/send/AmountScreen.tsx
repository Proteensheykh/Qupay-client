import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader, CTAButton, BottomSheet } from '../../components';
import { getCurrencies, getRate } from '../../api/rates';
import type { CurrencyResponse, RateResponse } from '../../api/rates';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<SendFlowParamList, 'Amount'>;

interface CurrencyDisplay extends CurrencyResponse {
  icon: string;
  color: string;
  symbol: string;
}

const CURRENCY_META: Record<string, { icon: string; color: string; symbol: string }> = {
  // Crypto
  USDT: { icon: '💵', color: '#26A17B', symbol: '' },
  USDC: { icon: '💵', color: '#2775CA', symbol: '' },
  BTC: { icon: '₿', color: '#F7931A', symbol: '₿' },
  ETH: { icon: '⟠', color: '#627EEA', symbol: 'Ξ' },
  // Major currencies
  USD: { icon: '🇺🇸', color: '#1A3D7C', symbol: '$' },
  EUR: { icon: '🇪🇺', color: '#003399', symbol: '€' },
  GBP: { icon: '🇬🇧', color: '#012169', symbol: '£' },
  JPY: { icon: '🇯🇵', color: '#BC002D', symbol: '¥' },
  CHF: { icon: '🇨🇭', color: '#D52B1E', symbol: 'Fr' },
  CAD: { icon: '🇨🇦', color: '#FF0000', symbol: 'C$' },
  AUD: { icon: '🇦🇺', color: '#00008B', symbol: 'A$' },
  NZD: { icon: '🇳🇿', color: '#00247D', symbol: 'NZ$' },
  CNY: { icon: '🇨🇳', color: '#DE2910', symbol: '¥' },
  HKD: { icon: '🇭🇰', color: '#DE2910', symbol: 'HK$' },
  SGD: { icon: '🇸🇬', color: '#EF3340', symbol: 'S$' },
  // Africa
  NGN: { icon: '🇳🇬', color: '#008751', symbol: '₦' },
  GHS: { icon: '🇬🇭', color: '#CE1126', symbol: '₵' },
  KES: { icon: '🇰🇪', color: '#006600', symbol: 'KSh' },
  ZAR: { icon: '🇿🇦', color: '#007749', symbol: 'R' },
  EGP: { icon: '🇪🇬', color: '#C8102E', symbol: 'E£' },
  MAD: { icon: '🇲🇦', color: '#C1272D', symbol: 'DH' },
  TZS: { icon: '🇹🇿', color: '#1EB53A', symbol: 'TSh' },
  UGX: { icon: '🇺🇬', color: '#FCDC04', symbol: 'USh' },
  XOF: { icon: '🇸🇳', color: '#00853F', symbol: 'CFA' },
  XAF: { icon: '🇨🇲', color: '#007A5E', symbol: 'FCFA' },
  // Asia
  INR: { icon: '🇮🇳', color: '#FF9933', symbol: '₹' },
  PHP: { icon: '🇵🇭', color: '#0038A8', symbol: '₱' },
  PKR: { icon: '🇵🇰', color: '#01411C', symbol: 'Rs' },
  BDT: { icon: '🇧🇩', color: '#006A4E', symbol: '৳' },
  IDR: { icon: '🇮🇩', color: '#CE1126', symbol: 'Rp' },
  MYR: { icon: '🇲🇾', color: '#010066', symbol: 'RM' },
  THB: { icon: '🇹🇭', color: '#A51931', symbol: '฿' },
  VND: { icon: '🇻🇳', color: '#DA251D', symbol: '₫' },
  KRW: { icon: '🇰🇷', color: '#003478', symbol: '₩' },
  TWD: { icon: '🇹🇼', color: '#FE0000', symbol: 'NT$' },
  // Middle East
  AED: { icon: '🇦🇪', color: '#00732F', symbol: 'د.إ' },
  SAR: { icon: '🇸🇦', color: '#006C35', symbol: '﷼' },
  QAR: { icon: '🇶🇦', color: '#8D1B3D', symbol: '﷼' },
  KWD: { icon: '🇰🇼', color: '#007A3D', symbol: 'د.ك' },
  BHD: { icon: '🇧🇭', color: '#CE1126', symbol: '.د.ب' },
  OMR: { icon: '🇴🇲', color: '#DB161B', symbol: '﷼' },
  ILS: { icon: '🇮🇱', color: '#0038B8', symbol: '₪' },
  TRY: { icon: '🇹🇷', color: '#E30A17', symbol: '₺' },
  // Americas
  MXN: { icon: '🇲🇽', color: '#006847', symbol: '$' },
  BRL: { icon: '🇧🇷', color: '#009739', symbol: 'R$' },
  ARS: { icon: '🇦🇷', color: '#75AADB', symbol: '$' },
  COP: { icon: '🇨🇴', color: '#FCD116', symbol: '$' },
  CLP: { icon: '🇨🇱', color: '#D52B1E', symbol: '$' },
  PEN: { icon: '🇵🇪', color: '#D91023', symbol: 'S/' },
  // Europe
  PLN: { icon: '🇵🇱', color: '#DC143C', symbol: 'zł' },
  CZK: { icon: '🇨🇿', color: '#11457E', symbol: 'Kč' },
  HUF: { icon: '🇭🇺', color: '#436F4D', symbol: 'Ft' },
  SEK: { icon: '🇸🇪', color: '#006AA7', symbol: 'kr' },
  NOK: { icon: '🇳🇴', color: '#BA0C2F', symbol: 'kr' },
  DKK: { icon: '🇩🇰', color: '#C8102E', symbol: 'kr' },
  RUB: { icon: '🇷🇺', color: '#0039A6', symbol: '₽' },
  UAH: { icon: '🇺🇦', color: '#005BBB', symbol: '₴' },
  RON: { icon: '🇷🇴', color: '#002B7F', symbol: 'lei' },
  BGN: { icon: '🇧🇬', color: '#00966E', symbol: 'лв' },
  HRK: { icon: '🇭🇷', color: '#171796', symbol: 'kn' },
  // Others
  AFN: { icon: '🇦🇫', color: '#000000', symbol: '؋' },
  ALL: { icon: '🇦🇱', color: '#E41E20', symbol: 'L' },
  AMD: { icon: '🇦🇲', color: '#D90012', symbol: '֏' },
  ANG: { icon: '🇨🇼', color: '#002B7F', symbol: 'ƒ' },
  AOA: { icon: '🇦🇴', color: '#CE1126', symbol: 'Kz' },
};

const DEFAULT_META = { icon: '🌍', color: '#666666', symbol: '' };

const FALLBACK_CURRENCIES: CurrencyDisplay[] = [
  { code: 'USDT', name: 'Tether', ...CURRENCY_META['USDT'] },
  { code: 'NGN', name: 'Nigerian Naira', ...CURRENCY_META['NGN'] },
  { code: 'GHS', name: 'Ghanaian Cedi', ...CURRENCY_META['GHS'] },
  { code: 'KES', name: 'Kenyan Shilling', ...CURRENCY_META['KES'] },
  { code: 'INR', name: 'Indian Rupee', ...CURRENCY_META['INR'] },
  { code: 'PHP', name: 'Philippine Peso', ...CURRENCY_META['PHP'] },
  { code: 'MXN', name: 'Mexican Peso', ...CURRENCY_META['MXN'] },
  { code: 'PKR', name: 'Pakistani Rupee', ...CURRENCY_META['PKR'] },
  { code: 'ZAR', name: 'South African Rand', ...CURRENCY_META['ZAR'] },
];

const isCrypto = (code: string): boolean => code === 'USDT';

const formatRate = (value: number): string => {
  if (value === 0) return '0';
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (value >= 0.01) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  if (value >= 0.0001) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  }
  return value.toExponential(2);
};

export const AmountScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [currencies, setCurrencies] = useState<CurrencyDisplay[]>(FALLBACK_CURRENCIES);
  const [selectedSendCurrency, setSelectedSendCurrency] = useState<CurrencyDisplay>(FALLBACK_CURRENCIES[0]);
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState<CurrencyDisplay>(FALLBACK_CURRENCIES[1]);
  const [showSendPicker, setShowSendPicker] = useState(false);
  const [showReceivePicker, setShowReceivePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return currencies;
    const search = currencySearch.toLowerCase();
    return currencies.filter(
      (c) => c.code.toLowerCase().includes(search) || c.name.toLowerCase().includes(search)
    );
  }, [currencies, currencySearch]);

  const handleCloseSendPicker = useCallback(() => {
    setShowSendPicker(false);
    setCurrencySearch('');
  }, []);

  const handleCloseReceivePicker = useCallback(() => {
    setShowReceivePicker(false);
    setCurrencySearch('');
  }, []);

  const [rateData, setRateData] = useState<RateResponse | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(false);
  const rateFetchRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    getCurrencies()
      .then((data) => {
        if (!mounted) return;
        const enriched: CurrencyDisplay[] = data.map((c) => ({
          ...c,
          ...(CURRENCY_META[c.code] || DEFAULT_META),
        }));
        setCurrencies(enriched);
        if (enriched.length >= 2) {
          setSelectedSendCurrency(enriched[0]);
          setSelectedReceiveCurrency(enriched[1]);
        }
      })
      .catch(() => {
        // Keep fallback currencies on error
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const fetchId = ++rateFetchRef.current;
    const from = selectedSendCurrency.code;
    const to = selectedReceiveCurrency.code;

    if (from === to) {
      setRateData({ fromCurrency: from, toCurrency: to, rate: 1, inverseRate: 1, source: 'identity', fetchedAt: new Date().toISOString() });
      setRateLoading(false);
      setRateError(false);
      return;
    }

    setRateLoading(true);
    setRateError(false);

    const timeoutId = setTimeout(() => {
      getRate(from, to)
        .then((data) => {
          if (rateFetchRef.current !== fetchId) return;
          setRateData(data);
          setRateError(false);
        })
        .catch(() => {
          if (rateFetchRef.current !== fetchId) return;
          setRateError(true);
          setRateData(null);
        })
        .finally(() => {
          if (rateFetchRef.current !== fetchId) return;
          setRateLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedSendCurrency.code, selectedReceiveCurrency.code]);

  const handleAmountChange = useCallback((text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
      cleaned = cleaned.slice(1);
    }
    
    setAmount(cleaned);
  }, []);

  const rate = rateData?.rate ?? 0;
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

  const renderRatePillContent = () => {
    if (rateLoading) {
      return <ActivityIndicator size="small" color={theme.secondary.main} />;
    }
    if (rateError || !rateData) {
      return <Text style={[styles.ratePillText, { color: theme.error.main }]}>Rate unavailable</Text>;
    }
    if (receivingCrypto) {
      return (
        <Text style={[styles.ratePillText, { color: theme.secondary.main }]}>
          1 {selectedReceiveCurrency.code} = {selectedSendCurrency.symbol}{formatRate(rateData.inverseRate)} {selectedSendCurrency.code}
        </Text>
      );
    }
    return (
      <Text style={[styles.ratePillText, { color: theme.secondary.main }]}>
        1 {selectedSendCurrency.code} = {selectedReceiveCurrency.symbol}{formatRate(rate)}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background.default }]} edges={['top']}>
      <ScreenHeader title="Send" />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              {renderRatePillContent()}
            </View>
            <View style={[styles.rateLine, { backgroundColor: theme.inputBorder }]} />
          </View>

          <View style={[styles.acSectionRecv, { backgroundColor: theme.background.paper }]}>
            <Text style={[styles.acLabel, { color: theme.text.secondary }]}>They receive</Text>
            <View style={styles.acRowSpaced}>
              <Text style={[styles.recvAmount, { color: theme.secondary.main }]}>
                {numAmount > 0 && rate > 0
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
            disabled={numAmount <= 0 || rate <= 0 || rateLoading}
          />
        </View>
      </ScrollView>

      <BottomSheet visible={showSendPicker} onClose={handleCloseSendPicker} title="Send Currency">
        <View style={styles.searchContainer}>
          <View style={[styles.searchWrap, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
            <Ionicons name="search" size={18} color={theme.text.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text.primary }]}
              placeholder="Search currency..."
              placeholderTextColor={theme.text.muted}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {currencySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCurrencySearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={theme.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          style={styles.currencyList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[
                styles.cpItem,
                { borderBottomColor: theme.inputBorder },
                selectedSendCurrency.code === c.code && { backgroundColor: theme.info.bg },
              ]}
              onPress={() => { setSelectedSendCurrency(c); handleCloseSendPicker(); }}
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
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="search-outline" size={32} color={theme.text.muted} />
              <Text style={[styles.emptyListText, { color: theme.text.muted }]}>No currencies found</Text>
            </View>
          }
        />
      </BottomSheet>

      <BottomSheet visible={showReceivePicker} onClose={handleCloseReceivePicker} title="Receive Currency">
        <View style={styles.searchContainer}>
          <View style={[styles.searchWrap, { backgroundColor: theme.background.surface, borderColor: theme.inputBorder }]}>
            <Ionicons name="search" size={18} color={theme.text.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text.primary }]}
              placeholder="Search currency..."
              placeholderTextColor={theme.text.muted}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {currencySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCurrencySearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={theme.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          style={styles.currencyList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[
                styles.cpItem,
                { borderBottomColor: theme.inputBorder },
                selectedReceiveCurrency.code === c.code && { backgroundColor: theme.info.bg },
              ]}
              onPress={() => { setSelectedReceiveCurrency(c); handleCloseReceivePicker(); }}
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
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="search-outline" size={32} color={theme.text.muted} />
              <Text style={[styles.emptyListText, { color: theme.text.muted }]}>No currencies found</Text>
            </View>
          }
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
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
    minHeight: 28, justifyContent: 'center', alignItems: 'center',
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
  searchContainer: { paddingHorizontal: 24, paddingBottom: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    padding: 0,
  },
  currencyList: { maxHeight: 350 },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyListText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader, CTAButton, BottomSheet, Odometer, Numpad } from '../../components';
import { getCurrencies, getRate } from '../../api/rates';
import type { CurrencyResponse, RateResponse } from '../../api/rates';
import { findCurrencyLogo } from '../../data/logos';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';
import { isPairSupported, isSupportedCurrency } from '../../constants/supportedChannels';
import { spacing, typography } from '../../theme';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';

const MIN_AMOUNT = 0.000001;
const MAX_AMOUNT = 10000;

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

const CRYPTO_CODES = new Set(['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'MATIC', 'POL', 'DAI', 'BUSD', 'TUSD', 'FRAX']);

const CurrencyIcon: React.FC<{ code: string; emoji: string; size: number }> = ({ code, emoji, size }) => {
  const logo = CRYPTO_CODES.has(code) ? findCurrencyLogo(code) : undefined;
  if (logo) {
    return <Image source={{ uri: logo.uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return <Text style={{ fontSize: size * 0.7, lineHeight: size }}>{emoji}</Text>;
};

const FALLBACK_CURRENCIES: CurrencyDisplay[] = [
  { code: 'USDT', name: 'Tether', ...CURRENCY_META['USDT'] },
  { code: 'NGN', name: 'Nigerian Naira', ...CURRENCY_META['NGN'] },
];

const CRYPTO_CURRENCY_CODES = new Set(['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'DAI', 'BUSD']);
const isCrypto = (code: string): boolean => CRYPTO_CURRENCY_CODES.has(code);

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

const currencyPillBase = {
  backgroundColor: palette.grey[800],
  borderWidth: 1,
  borderColor: palette.material.lightThin,
  borderRadius: radii.xl,
};

const findByCode = (list: CurrencyDisplay[], code: string): CurrencyDisplay | undefined =>
  list.find((c) => c.code === code);

export const AmountScreen: React.FC<Props> = ({ navigation }) => {
  const hairline = borders.hairline.dark;
  const [currencies, setCurrencies] = useState<CurrencyDisplay[]>(FALLBACK_CURRENCIES);
  const [selectedSendCurrency, setSelectedSendCurrency] = useState<CurrencyDisplay>(
    findByCode(FALLBACK_CURRENCIES, 'USDT') ?? FALLBACK_CURRENCIES[0]
  );
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState<CurrencyDisplay>(
    findByCode(FALLBACK_CURRENCIES, 'NGN') ?? FALLBACK_CURRENCIES[1]
  );
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
        const enriched: CurrencyDisplay[] = data
          .filter((c) => isSupportedCurrency(c.code))
          .map((c) => ({
            ...c,
            ...(CURRENCY_META[c.code] || DEFAULT_META),
          }));

        const list = enriched.length >= 2 ? enriched : FALLBACK_CURRENCIES;
        setCurrencies(list);

        const usdt = findByCode(list, 'USDT');
        const ngn = findByCode(list, 'NGN');
        if (usdt) setSelectedSendCurrency(usdt);
        if (ngn) setSelectedReceiveCurrency(ngn);
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

  const odometerValue = amount.length ? amount : '0';

  const onNumpadKey = useCallback(
    (key: string) => {
      if (key === 'del') {
        setAmount((prev) => prev.slice(0, -1));
        return;
      }
      handleAmountChange(amount + key);
    },
    [amount, handleAmountChange]
  );

  const rate = rateData?.rate ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const receivingCrypto = isCrypto(selectedReceiveCurrency.code);
  const receiveAmount = receivingCrypto
    ? parseFloat((numAmount * rate).toFixed(2))
    : Math.round(numAmount * rate);

  const pairSupported = isPairSupported(selectedSendCurrency.code, selectedReceiveCurrency.code);
  const amountValid = numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT;
  const canContinue = amountValid && pairSupported && rate > 0 && !rateLoading;

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
      return <ActivityIndicator size="small" color={palette.royal[500]} />;
    }
    if (rateError || !rateData) {
      return <Text style={[styles.ratePillText, { color: palette.status.negative }]}>Rate unavailable</Text>;
    }
    if (receivingCrypto) {
      return (
        <Text style={[styles.ratePillText, { color: palette.grey[300] }]}>
          1 {selectedReceiveCurrency.code} = {selectedSendCurrency.symbol}{formatRate(rateData.inverseRate)} {selectedSendCurrency.code}
        </Text>
      );
    }
    return (
      <Text style={[styles.ratePillText, { color: palette.grey[300] }]}>
        1 {selectedSendCurrency.code} = {selectedReceiveCurrency.symbol}{formatRate(rate)}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      <ScreenHeader title="Send" />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.amountCard, { backgroundColor: palette.grey[800] }, hairline]}>
          <View style={styles.acSection}>
            <Text style={[styles.acLabel, { color: palette.grey[500] }]}>You send</Text>
            <View style={styles.acRowSpaced}>
              <View style={styles.odometerRow}>
                <Odometer value={odometerValue} color={palette.grey[300]} fontSize={56} />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.currencyPill,
                  currencyPillBase,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setShowSendPicker(true)}
              >
                <View style={[styles.cpIconWrapSmall, { backgroundColor: selectedSendCurrency.color + '20' }]}>
                  <CurrencyIcon code={selectedSendCurrency.code} emoji={selectedSendCurrency.icon} size={24} />
                </View>
                <Text style={[styles.currText, { color: palette.grey[300] }]}>{selectedSendCurrency.code}</Text>
                <Ionicons name="chevron-down" size={14} color={palette.grey[500]} />
              </Pressable>
            </View>
          </View>

          <View style={styles.rateDivider}>
            <View style={[styles.rateLine, { backgroundColor: palette.material.lightThin }]} />
            <View style={[styles.ratePill, { backgroundColor: palette.grey[900] }, hairline]}>
              {renderRatePillContent()}
            </View>
            <View style={[styles.rateLine, { backgroundColor: palette.material.lightThin }]} />
          </View>

          <View style={[styles.acSectionRecv, { backgroundColor: palette.grey[900] }]}>
            <Text style={[styles.acLabel, { color: palette.grey[500] }]}>They receive</Text>
            <View style={styles.acRowSpaced}>
              <Text style={[styles.recvAmount, { color: palette.grey[300] }]}>
                {numAmount > 0 && rate > 0
                  ? receivingCrypto
                    ? receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : `${selectedReceiveCurrency.symbol}${receiveAmount.toLocaleString()}`
                  : '—'}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.currencyPill, currencyPillBase, pressed && { opacity: 0.7 }]}
                onPress={() => setShowReceivePicker(true)}
              >
                <View style={[styles.cpIconWrapSmall, { backgroundColor: selectedReceiveCurrency.color + '20' }]}>
                  <CurrencyIcon code={selectedReceiveCurrency.code} emoji={selectedReceiveCurrency.icon} size={24} />
                </View>
                <Text style={[styles.currText, { color: palette.grey[300] }]}>{selectedReceiveCurrency.code}</Text>
                <Ionicons name="chevron-down" size={14} color={palette.grey[500]} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.numpadSection}>
          <Numpad onKey={onNumpadKey} size="compact" showDecimal />
        </View>

        <View style={styles.ctaWrap}>
          {!pairSupported && numAmount > 0 && (
            <Text style={[styles.pairWarning, { color: palette.status.partial }]}>
              {selectedSendCurrency.code} → {selectedReceiveCurrency.code} is not yet supported. Only USDT ↔ NGN is available.
            </Text>
          )}
          {numAmount > MAX_AMOUNT && (
            <Text style={[styles.pairWarning, { color: palette.status.negative }]}>
              Maximum amount is {MAX_AMOUNT.toLocaleString()} {selectedSendCurrency.code}
            </Text>
          )}
          <CTAButton
            title="Continue"
            onPress={handleContinue}
            disabled={!canContinue}
          />
        </View>
      </ScrollView>

      <BottomSheet visible={showSendPicker} onClose={handleCloseSendPicker} title="Send Currency">
        {currencies.length > 2 && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchWrap, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]}>
              <Ionicons name="search" size={18} color={palette.grey[500]} />
              <TextInput
                style={[styles.searchInput, { color: palette.grey[300] }]}
                placeholder="Search currency..."
                placeholderTextColor={palette.grey[500]}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {currencySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCurrencySearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={palette.grey[500]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
                { borderBottomColor: palette.material.lightThin },
                selectedSendCurrency.code === c.code && { backgroundColor: 'rgba(251,251,253,0.06)' },
              ]}
              onPress={() => {
                setSelectedSendCurrency(c);
                if (c.code === selectedReceiveCurrency.code) {
                  const other = currencies.find((x) => x.code !== c.code);
                  if (other) setSelectedReceiveCurrency(other);
                }
                handleCloseSendPicker();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.cpIconWrap, { backgroundColor: c.color + '20' }]}>
                <CurrencyIcon code={c.code} emoji={c.icon} size={36} />
              </View>
              <View style={styles.cpInfo}>
                <Text style={[styles.cpName, { color: palette.grey[300] }]}>{c.code}</Text>
                <Text style={[styles.cpSub, { color: palette.grey[500] }]}>{c.name}</Text>
              </View>
              {selectedSendCurrency.code === c.code && <Ionicons name="checkmark" size={18} color={palette.royal[500]} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="search-outline" size={32} color={palette.grey[500]} />
              <Text style={[styles.emptyListText, { color: palette.grey[500] }]}>No currencies found</Text>
            </View>
          }
        />
      </BottomSheet>

      <BottomSheet visible={showReceivePicker} onClose={handleCloseReceivePicker} title="Receive Currency">
        {currencies.length > 2 && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchWrap, { backgroundColor: palette.grey[800], borderColor: palette.material.lightThin }]}>
              <Ionicons name="search" size={18} color={palette.grey[500]} />
              <TextInput
                style={[styles.searchInput, { color: palette.grey[300] }]}
                placeholder="Search currency..."
                placeholderTextColor={palette.grey[500]}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {currencySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCurrencySearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={palette.grey[500]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
                { borderBottomColor: palette.material.lightThin },
                selectedReceiveCurrency.code === c.code && { backgroundColor: 'rgba(251,251,253,0.06)' },
              ]}
              onPress={() => {
                setSelectedReceiveCurrency(c);
                if (c.code === selectedSendCurrency.code) {
                  const other = currencies.find((x) => x.code !== c.code);
                  if (other) setSelectedSendCurrency(other);
                }
                handleCloseReceivePicker();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.cpIconWrap, { backgroundColor: c.color + '20' }]}>
                <CurrencyIcon code={c.code} emoji={c.icon} size={36} />
              </View>
              <View style={styles.cpInfo}>
                <Text style={[styles.cpName, { color: palette.grey[300] }]}>{c.code}</Text>
                <Text style={[styles.cpSub, { color: palette.grey[500] }]}>{c.name}</Text>
              </View>
              {selectedReceiveCurrency.code === c.code && <Ionicons name="checkmark" size={18} color={palette.royal[500]} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="search-outline" size={32} color={palette.grey[500]} />
              <Text style={[styles.emptyListText, { color: palette.grey[500] }]}>No currencies found</Text>
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
    marginHorizontal: spacing(6),
    marginTop: spacing(2),
    marginBottom: spacing(3),
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  acSection: { paddingVertical: spacing(5), paddingHorizontal: spacing(5) },
  acSectionRecv: { paddingVertical: spacing(4), paddingHorizontal: spacing(5), paddingBottom: spacing(5) },
  acLabel: {
    ...typography.label,
    marginBottom: spacing(2),
  },
  acRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountInput: {
    flex: 1,
    ...typography.value,
    minWidth: 60,
    maxWidth: '55%',
    padding: 0,
    margin: 0,
    borderWidth: 0,
  } as any,
  recvAmount: {
    flex: 1,
    ...typography.valueLg,
  },
  sendCurrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    borderRadius: radii.pill,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3.5),
    minWidth: 125,
    minHeight: 44,
  },
  recvCurrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    minWidth: 125,
    minHeight: 44,
  },
  cpIconWrapSmall: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  currText: { ...typography.buttonS },
  rateDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(5), gap: spacing(2.5) },
  rateLine: { flex: 1, height: 1 },
  ratePill: {
    borderRadius: radii.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratePillText: { ...typography.monoSm },
  pairWarning: {
    ...typography.helperText,
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  ctaWrap: { paddingHorizontal: spacing(6), paddingBottom: spacing(6) },
  odometerRow: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing(3),
    alignItems: 'flex-start',
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3.5),
    minWidth: 112,
    minHeight: 44,
  },
  numpadSection: {
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  cpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    borderBottomWidth: 1,
    minHeight: 56,
  },
  cpIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cpInfo: { flex: 1 },
  cpName: { ...typography.main14 },
  cpSub: { ...typography.caption },
  searchContainer: { paddingHorizontal: spacing(6), paddingBottom: spacing(3) },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  currencyList: { maxHeight: 350 },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(10),
    gap: spacing(2),
  },
  emptyListText: {
    ...typography.bodySm,
  },
});

export type Currency = 'USDT' | 'NGN';

export type PayoutChannel = 'bank' | 'wallet' | 'mobile_money';

export interface CurrencyPair {
  readonly from: Currency;
  readonly to: Currency;
}

export interface NetworkInfo {
  readonly id: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly comingSoon?: boolean;
}

export const SUPPORTED_PAIRS: readonly CurrencyPair[] = [
  { from: 'USDT', to: 'NGN' },
  { from: 'NGN', to: 'USDT' },
] as const;

export const SUPPORTED_CURRENCIES: readonly Currency[] = ['USDT', 'NGN'] as const;

export function isSupportedCurrency(code: string): code is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export const SUPPORTED_NETWORKS: readonly NetworkInfo[] = [
  { id: 'solana', label: 'Solana', enabled: true },
  { id: 'ethereum', label: 'Ethereum (ERC20)', enabled: false, comingSoon: true },
  { id: 'tron', label: 'Tron (TRC20)', enabled: false, comingSoon: true },
  { id: 'bsc', label: 'BNB Chain (BEP20)', enabled: false, comingSoon: true },
] as const;

export const SUPPORTED_PAYOUT_CHANNELS: Record<Currency, readonly PayoutChannel[]> = {
  NGN: ['bank'],
  USDT: ['wallet'],
} as const;

export function isPairSupported(from: string, to: string): boolean {
  return SUPPORTED_PAIRS.some((p) => p.from === from && p.to === to);
}

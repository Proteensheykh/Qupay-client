import { apiClient } from './client';
import type { Tier } from './kyc';

export interface TierLimitResponse {
  currency: string;
  tier: Tier;
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
}

/**
 * Fetches the payer-facing transfer limits. The backend may return one row per
 * tier or only the caller's row; select the row matching the user's KYC tier
 * (see `pickTierLimit`).
 */
export async function getTransactionLimits(
  currency?: string
): Promise<TierLimitResponse[]> {
  const response = await apiClient.get<TierLimitResponse[]>(
    '/v1/transactions/limits',
    { params: currency ? { currency } : undefined }
  );
  return response.data ?? [];
}

/**
 * Selects the limit row for a given tier. Falls back to the only returned row
 * when the endpoint scopes results to the caller, then to `undefined`.
 */
export function pickTierLimit(
  rows: TierLimitResponse[] | undefined,
  tier: Tier | undefined,
  currency?: string
): TierLimitResponse | undefined {
  if (!rows || rows.length === 0) return undefined;
  const byCurrency = currency
    ? rows.filter((r) => r.currency === currency)
    : rows;
  const pool = byCurrency.length > 0 ? byCurrency : rows;
  if (tier) {
    const match = pool.find((r) => r.tier === tier);
    if (match) return match;
  }
  return pool[0];
}

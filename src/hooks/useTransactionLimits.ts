import { useQuery } from '@tanstack/react-query';
import { getTransactionLimits, pickTierLimit } from '../api/limits';
import { queryKeys } from '../api/queryKeys';
import type { Tier } from '../api/kyc';

/**
 * Fetches transfer tier limits for a currency. Limits change rarely, so we keep
 * a long staleTime. Use `pickTierLimit` (or the `limitFor` helper) to select the
 * row matching the user's KYC tier.
 */
export function useTransactionLimits(currency?: string) {
  const query = useQuery({
    queryKey: queryKeys.transactions.limits(currency),
    queryFn: () => getTransactionLimits(currency),
    staleTime: 1000 * 60 * 30,
  });

  const limitFor = (tier: Tier | undefined) =>
    pickTierLimit(query.data, tier, currency);

  return { ...query, limitFor };
}

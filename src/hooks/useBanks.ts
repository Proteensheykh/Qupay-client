import { useQuery } from '@tanstack/react-query';
import { getBanks } from '../api/banks';
import { queryKeys } from '../api/queryKeys';

/**
 * Fetches the bank directory. Cached with a long staleTime so receipts can
 * cheaply resolve a bank code to its display name.
 */
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks.all(),
    queryFn: getBanks,
    staleTime: 1000 * 60 * 60,
  });
}

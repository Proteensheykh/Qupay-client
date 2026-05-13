import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTransaction,
  getTransaction,
  confirmTransfer,
  getMyTransactions,
} from '../api/transactions';
import { queryKeys } from '../api/queryKeys';
import { getPollingInterval } from '../utils/transactionStatus';
import type { CreateTransactionRequest } from '../types/transaction';

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byId(id),
    queryFn: () => getTransaction(id),
    enabled: !!id,
    retry: 2,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const status = query.state.data?.status;
      if (!status) return 5000;
      return getPollingInterval(status);
    },
  });
}

export function useMyTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.transactions.list(page, size),
    queryFn: () => getMyTransactions(page, size),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useConfirmTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => confirmTransfer(transactionId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.transactions.byId(data.id), data);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

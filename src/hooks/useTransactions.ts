import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  createTransaction,
  getTransaction,
  getTransactionStream,
  acceptTransaction,
  uploadSettlementProof,
  getUserTransactions,
} from '../api/transactions';
import type {
  CreateTransactionRequest,
  AcceptTransactionRequest,
  UploadSettlementProofRequest,
  TransactionStatus,
} from '../types/transaction';

const terminalStatuses: TransactionStatus[] = ['COMPLETED', 'FAILED', 'EXPIRED'];

export function useTransaction(slugOrId: string) {
  return useQuery({
    queryKey: ['transaction', slugOrId],
    queryFn: () => getTransaction(slugOrId),
    enabled: !!slugOrId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && terminalStatuses.includes(status)) {
        return false;
      }
      return 5000;
    },
  });
}

export function useUserTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['userTransactions', page, limit],
    queryFn: () => getUserTransactions(page, limit),
  });
}

export function useTransactionStream() {
  return useInfiniteQuery({
    queryKey: ['processor', 'stream'],
    queryFn: ({ pageParam = 1 }) => getTransactionStream(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    refetchInterval: 10000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['processor', 'stream'] });
    },
  });
}

export function useAcceptTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcceptTransactionRequest) => acceptTransaction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['processor', 'stream'] });
    },
  });
}

export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadSettlementProofRequest) => uploadSettlementProof(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['processor', 'stream'] });
    },
  });
}

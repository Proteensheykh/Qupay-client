import {
  useTransactionStore,
  generateSlug,
  generateId,
} from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  TransactionDetail,
  TransactionStreamItem,
  AcceptTransactionRequest,
  UploadSettlementProofRequest,
  PaginatedResponse,
} from '../types/transaction';

function mockDelay<T>(data: T, ms?: number): Promise<T> {
  const delay = ms ?? 400 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

export const createTransaction = async (
  data: CreateTransactionRequest
): Promise<CreateTransactionResponse> => {
  const id = generateId();
  const slug = generateSlug();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const currentUserId = useAuthStore.getState().user?.id || 'anonymous';

  const corridorFlags: Record<string, string> = {
    'sg-ng': '🇸🇬→🇳🇬',
    'sg-gh': '🇸🇬→🇬🇭',
    'sg-ke': '🇸🇬→🇰🇪',
    'uk-ng': '🇬🇧→🇳🇬',
    'us-ph': '🇺🇸→🇵🇭',
    'ae-pk': '🇦🇪→🇵🇰',
    'us-mx': '🇺🇸→🇲🇽',
    'uk-in': '🇬🇧→🇮🇳',
  };

  const newTransaction: TransactionDetail = {
    id,
    slug,
    status: 'PENDING_DEPOSIT',
    sendAmount: data.sendAmount,
    sendCurrency: data.sendCurrency,
    receiveAmount: data.receiveAmount,
    receiveCurrency: data.receiveCurrency,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    recipientAccountType: data.recipientAccountType,
    recipientAccountLabel: data.recipientAccountLabel,
    recipientWalletAddress: data.recipientWalletAddress,
    recipientNetwork: data.recipientNetwork,
    fee: Math.round(data.sendAmount * 0.015 * 100) / 100,
    rate: data.receiveAmount / data.sendAmount,
    depositAddress: data.depositAddress,
    depositNetwork: data.depositNetwork,
    corridorId: data.corridorId,
    corridorDisplay: corridorFlags[data.corridorId] || '🌍→🌍',
    payerId: currentUserId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt,
  };

  useTransactionStore.getState().addTransaction(newTransaction);

  const response: CreateTransactionResponse = {
    id,
    slug,
    status: 'PENDING_DEPOSIT',
    depositAddress: data.depositAddress,
    depositNetwork: data.depositNetwork,
    expiresAt,
  };

  return mockDelay(response);
};

export const getTransaction = async (
  slugOrId: string
): Promise<TransactionDetail | null> => {
  const tx = useTransactionStore.getState().getTransaction(slugOrId);
  return mockDelay(tx || null, 200);
};

export const getTransactionStream = async (
  page = 1,
  limit = 20
): Promise<PaginatedResponse<TransactionStreamItem>> => {
  const allTransactions = useTransactionStore.getState().getStreamTransactions();

  const processorVisibleStatuses = [
    'DEPOSIT_CONFIRMED',
    'MATCHED',
    'SETTLEMENT_IN_PROGRESS',
    'SETTLEMENT_PROOF_UPLOADED',
    'COMPLETED',
  ];

  const filtered = allTransactions.filter((tx) =>
    processorVisibleStatuses.includes(tx.status)
  );

  const start = (page - 1) * limit;
  const end = start + limit;
  const paged = filtered.slice(start, end);

  const items: TransactionStreamItem[] = paged.map((tx) => ({
    id: tx.id,
    slug: tx.slug,
    status: tx.status,
    sendAmount: tx.sendAmount,
    sendCurrency: tx.sendCurrency,
    receiveAmount: tx.receiveAmount,
    receiveCurrency: tx.receiveCurrency,
    recipientAccountType: tx.recipientAccountType,
    recipientAccountLabel: tx.recipientAccountLabel,
    corridorDisplay: tx.corridorDisplay,
    createdAt: tx.createdAt,
  }));

  return mockDelay({
    items,
    total: filtered.length,
    page,
    limit,
    hasMore: end < filtered.length,
  });
};

export const acceptTransaction = async (
  data: AcceptTransactionRequest
): Promise<TransactionDetail | null> => {
  const store = useTransactionStore.getState();
  const currentUserId = useAuthStore.getState().user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }
  
  store.setProcessorId(data.transactionId, currentUserId);
  store.updateStatus(data.transactionId, 'SETTLEMENT_IN_PROGRESS');

  const tx = store.getTransaction(data.transactionId);
  return mockDelay(tx || null, 600);
};

export const uploadSettlementProof = async (
  data: UploadSettlementProofRequest
): Promise<TransactionDetail | null> => {
  const store = useTransactionStore.getState();
  store.updateProof(
    data.transactionId,
    data.proofData,
    data.proofType,
    data.notes
  );

  const tx = store.getTransaction(data.transactionId);
  return mockDelay(tx || null, 800);
};

export const getUserTransactions = async (
  page = 1,
  limit = 20
): Promise<PaginatedResponse<TransactionDetail>> => {
  const allTransactions = useTransactionStore.getState().getStreamTransactions();

  const start = (page - 1) * limit;
  const end = start + limit;
  const paged = allTransactions.slice(start, end);

  return mockDelay({
    items: paged,
    total: allTransactions.length,
    page,
    limit,
    hasMore: end < allTransactions.length,
  });
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: import('../types/transaction').TransactionStatus
): Promise<void> => {
  useTransactionStore.getState().updateStatus(transactionId, status);
  return mockDelay(undefined, 100);
};

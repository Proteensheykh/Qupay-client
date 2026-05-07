import { apiClient } from './client';
import { normalizeStatus } from '../utils/transactionStatus';
import type {
  CreateTransactionRequest,
  Transaction,
  TransactionListItem,
} from '../types/transaction';

function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  };
}

function normalizeListItem(raw: any): TransactionListItem {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  };
}

export async function createTransaction(
  data: CreateTransactionRequest
): Promise<Transaction> {
  const response = await apiClient.post<Transaction>('/v1/transactions', data);
  return normalizeTransaction(response.data);
}

export async function getTransaction(id: string): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(`/v1/transactions/${id}`);
  return normalizeTransaction(response.data);
}

export async function confirmTransfer(id: string): Promise<Transaction> {
  const response = await apiClient.post<Transaction>(
    `/v1/transactions/${id}/confirm`
  );
  return normalizeTransaction(response.data);
}

export async function getMyTransactions(
  page = 0,
  size = 20
): Promise<TransactionListItem[]> {
  const response = await apiClient.get<TransactionListItem[]>(
    '/v1/transactions',
    { params: { page, size } }
  );
  const data = response.data;
  if (Array.isArray(data)) {
    return data.map(normalizeListItem);
  }
  // Handle paginated wrapper if backend returns {content: [...]}
  if (data && typeof data === 'object' && 'content' in (data as any)) {
    return ((data as any).content as any[]).map(normalizeListItem);
  }
  return [];
}

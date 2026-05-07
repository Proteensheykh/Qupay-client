import { apiClient } from './client';
import { normalizeStatus } from '../utils/transactionStatus';
import type { TransactionStatus, StatusGroup } from '../types/transaction';

export interface MpOrder {
  id: string;
  transactionId: string;
  transactionCode: string;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  fxRate: number;
  status: TransactionStatus;
  statusGroup: StatusGroup;
  recipientBankCode?: string | null;
  recipientAccountNumber?: string | null;
  recipientAccountName?: string | null;
  recipientWalletAddress?: string | null;
  payerConfirmed: boolean;
  proofUrl?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
}

export interface UploadProofRequest {
  proofUrl: string;
  contentType?: string;
  description?: string;
}

function normalizeOrder(raw: any): MpOrder {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  };
}

function normalizeOrders(raw: any): MpOrder[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeOrder);
  }
  if (raw && typeof raw === 'object' && 'content' in raw) {
    return (raw.content as any[]).map(normalizeOrder);
  }
  return [];
}

export async function getQueue(): Promise<MpOrder[]> {
  const response = await apiClient.get('/v1/mp/queue');
  return normalizeOrders(response.data);
}

export async function acceptOrder(transactionId: string): Promise<MpOrder> {
  const response = await apiClient.post<MpOrder>(
    `/v1/mp/orders/${transactionId}/accept`
  );
  return normalizeOrder(response.data);
}

export async function getMyOrders(): Promise<MpOrder[]> {
  const response = await apiClient.get('/v1/mp/me/orders');
  return normalizeOrders(response.data);
}

export async function uploadProof(
  orderId: string,
  data: UploadProofRequest
): Promise<void> {
  await apiClient.post(`/v1/mp/orders/${orderId}/proof`, data);
}

import { apiClient } from './client';
import { normalizeStatus } from '../utils/transactionStatus';
import type { TransactionStatus, StatusGroup } from '../types/transaction';

export interface MpOrder {
  orderId: string;
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
  file: {
    uri: string;
    name: string;
    mimeType: string;
  };
  description?: string;
}

function normalizeOrder(raw: any): MpOrder {
  return {
    ...raw,
    orderId: raw?.orderId ?? raw?.id,
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
  const form = new FormData();
  const uri = data.file.uri;

  // Web (react-dom / Expo web): FormData requires Blob/File, not RN's { uri, name, type } object.
  if (
    typeof window !== 'undefined' &&
    (uri.startsWith('blob:') || uri.startsWith('http://') || uri.startsWith('https://'))
  ) {
    const res = await fetch(uri);
    const blob = await res.blob();
    const typedBlob =
      data.file.mimeType && blob.type !== data.file.mimeType
        ? new Blob([await blob.arrayBuffer()], { type: data.file.mimeType })
        : blob;
    form.append('file', typedBlob, data.file.name);
  } else {
    // Native (iOS/Android): axios/RN can handle the { uri, name, type } shape.
    form.append(
      'file',
      {
        uri,
        name: data.file.name,
        type: data.file.mimeType,
      } as any
    );
  }

  await apiClient.post(`/v1/mp/orders/${orderId}/proof`, form, {
    params: data.description ? { description: data.description } : undefined,
  });
}

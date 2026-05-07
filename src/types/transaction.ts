export type TransactionStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'PAYER_PAID'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export type StatusGroup = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Recipient {
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  walletAddress?: string | null;
  phone?: string | null;
}

export interface MpPaymentDetails {
  walletAddress?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}

export interface TransactionProof {
  proofUrl: string;
  contentType?: string;
  description?: string;
  uploadedAt?: string;
}

export interface CreateTransactionRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  recipient: Recipient;
  pin: string;
}

export interface Transaction {
  id: string;
  transactionCode: string;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  chargeAmount: number;
  convertedAmount: number;
  fxRate: number;
  status: TransactionStatus;
  statusGroup: StatusGroup;
  recipient: Recipient;
  mpPaymentDetails: MpPaymentDetails | null;
  expiresAt: string;
  createdAt: string;
  payerConfirmationDeadline: string | null;
  proof: TransactionProof | null;
}

export interface TransactionListItem {
  id: string;
  transactionCode: string;
  status: TransactionStatus;
  statusGroup: StatusGroup;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  createdAt: string;
  proof: TransactionProof | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
}

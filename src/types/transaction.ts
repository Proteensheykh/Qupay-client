export type TransactionStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'PAYER_PAID'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export type StatusGroup = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type Tier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';

export type CryptoNetwork = 'SOLANA' | 'ERC20' | 'TRC20' | 'BEP20';

export interface Recipient {
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  walletAddress?: string | null;
  network?: CryptoNetwork | null;
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
  totalToSend?: number;
  convertedAmount: number;
  fxRate: number;
  transactionTier?: Tier;
  spreadRate?: number;
  status: TransactionStatus;
  statusGroup: StatusGroup;
  recipient: Recipient;
  mpPaymentDetails: MpPaymentDetails | null;
  expiresAt: string;
  createdAt: string;
  completedAt?: string | null;
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
  totalToSend?: number;
  convertedAmount: number;
  transactionTier?: Tier;
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

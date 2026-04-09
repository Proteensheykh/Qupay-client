export type TransactionStatus =
  | 'PENDING_DEPOSIT'
  | 'DEPOSIT_CONFIRMED'
  | 'MATCHED'
  | 'SETTLEMENT_IN_PROGRESS'
  | 'SETTLEMENT_PROOF_UPLOADED'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'DISPUTED';

export type ProofType = 'receipt_image' | 'transaction_hash' | 'reference_number';

export interface CreateTransactionRequest {
  corridorId: string;
  sendAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveAmount: number;
  recipientName: string;
  recipientPhone?: string;
  recipientAccountType: 'mobile_money' | 'bank' | 'wallet';
  recipientAccountLabel: string;
  recipientWalletAddress?: string;
  recipientNetwork?: string;
  depositNetwork: string;
  depositAddress: string;
}

export interface CreateTransactionResponse {
  id: string;
  slug: string;
  status: TransactionStatus;
  depositAddress: string;
  depositNetwork: string;
  expiresAt: string;
}

export interface TransactionDetail {
  id: string;
  slug: string;
  status: TransactionStatus;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientName: string;
  recipientPhone?: string;
  recipientAccountType: 'mobile_money' | 'bank' | 'wallet';
  recipientAccountLabel: string;
  recipientWalletAddress?: string;
  recipientNetwork?: string;
  fee: number;
  rate: number;
  depositAddress: string;
  depositNetwork: string;
  corridorId: string;
  corridorDisplay: string;
  settlementProofUrl?: string;
  settlementProofType?: ProofType;
  settlementNotes?: string;
  processorId?: string;
  payerId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  completedAt?: string;
}

export interface TransactionStreamItem {
  id: string;
  slug: string;
  status: TransactionStatus;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientAccountType: 'mobile_money' | 'bank' | 'wallet';
  recipientAccountLabel: string;
  corridorDisplay: string;
  createdAt: string;
}

export interface AcceptTransactionRequest {
  transactionId: string;
}

export interface UploadSettlementProofRequest {
  transactionId: string;
  proofType: ProofType;
  proofData: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

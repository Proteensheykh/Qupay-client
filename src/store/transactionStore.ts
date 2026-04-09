import { create } from 'zustand';
import type {
  TransactionDetail,
  TransactionStatus,
  ProofType,
} from '../types/transaction';

const generateSlug = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let slug = 'QP-';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
};

const generateId = (): string => `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const now = Date.now();
const hour = 3600000;

const seedTransactions: TransactionDetail[] = [
  {
    id: 'txn_seed_001',
    slug: 'QP-X7K2M9',
    status: 'DEPOSIT_CONFIRMED',
    sendAmount: 150,
    sendCurrency: 'USDT',
    receiveAmount: 243000,
    receiveCurrency: 'NGN',
    recipientName: 'Chinedu Okafor',
    recipientPhone: '+234 812 345 6789',
    recipientAccountType: 'mobile_money',
    recipientAccountLabel: 'OPay',
    fee: 2.25,
    rate: 1620,
    depositAddress: '0x4c2A9f8E3d7B6a1C0e5F2d8A9b4C7e6F3a1D5b',
    depositNetwork: 'Polygon',
    corridorId: 'sg-ng',
    corridorDisplay: '🇸🇬→🇳🇬',
    payerId: 'user_001',
    createdAt: new Date(now - 2 * hour).toISOString(),
    updatedAt: new Date(now - 1.5 * hour).toISOString(),
    expiresAt: new Date(now + 28 * hour).toISOString(),
  },
  {
    id: 'txn_seed_002',
    slug: 'QP-A3F8N1',
    status: 'MATCHED',
    sendAmount: 200,
    sendCurrency: 'USDT',
    receiveAmount: 2364,
    receiveCurrency: 'GHS',
    recipientName: 'Kofi Asante',
    recipientPhone: '+233 24 567 8901',
    recipientAccountType: 'mobile_money',
    recipientAccountLabel: 'MTN MoMo',
    fee: 3.0,
    rate: 11.82,
    depositAddress: '0x7a3B8c9D1e2F3a4B5c6D7e8F9a0B1c2D3e4F2e',
    depositNetwork: 'Ethereum',
    corridorId: 'sg-gh',
    corridorDisplay: '🇸🇬→🇬🇭',
    payerId: 'user_002',
    createdAt: new Date(now - 4 * hour).toISOString(),
    updatedAt: new Date(now - 3.5 * hour).toISOString(),
    expiresAt: new Date(now + 26 * hour).toISOString(),
  },
  {
    id: 'txn_seed_003',
    slug: 'QP-R5T2W8',
    status: 'SETTLEMENT_IN_PROGRESS',
    sendAmount: 500,
    sendCurrency: 'USDT',
    receiveAmount: 64350,
    receiveCurrency: 'KES',
    recipientName: 'Grace Mwangi',
    recipientPhone: '+254 712 345 678',
    recipientAccountType: 'mobile_money',
    recipientAccountLabel: 'M-Pesa',
    fee: 7.5,
    rate: 128.7,
    depositAddress: '0x1e8B4f7A2c9D3e6F5a0B8c1D4e7F9a2B5c3D6e',
    depositNetwork: 'Base',
    corridorId: 'sg-ke',
    corridorDisplay: '🇸🇬→🇰🇪',
    processorId: 'processor_001',
    payerId: 'user_003',
    createdAt: new Date(now - 8 * hour).toISOString(),
    updatedAt: new Date(now - 6 * hour).toISOString(),
    expiresAt: new Date(now + 22 * hour).toISOString(),
  },
  {
    id: 'txn_seed_004',
    slug: 'QP-K9M4P6',
    status: 'SETTLEMENT_PROOF_UPLOADED',
    sendAmount: 100,
    sendCurrency: 'USDT',
    receiveAmount: 159800,
    receiveCurrency: 'NGN',
    recipientName: 'Amara Obi',
    recipientPhone: '+234 803 456 7890',
    recipientAccountType: 'bank',
    recipientAccountLabel: 'GTBank',
    fee: 1.5,
    rate: 1598,
    depositAddress: '0x9d5F2e8A1b3C7d6E0f4A8B9c2D5e7F1a3B6c4d',
    depositNetwork: 'Arbitrum',
    corridorId: 'sg-ng',
    corridorDisplay: '🇸🇬→🇳🇬',
    processorId: 'processor_001',
    settlementProofUrl: 'https://example.com/receipt/12345.jpg',
    settlementProofType: 'receipt_image',
    settlementNotes: 'Transfer completed via GTBank app',
    payerId: 'user_001',
    createdAt: new Date(now - 12 * hour).toISOString(),
    updatedAt: new Date(now - 10 * hour).toISOString(),
    expiresAt: new Date(now + 18 * hour).toISOString(),
  },
  {
    id: 'txn_seed_005',
    slug: 'QP-B7L2X4',
    status: 'COMPLETED',
    sendAmount: 300,
    sendCurrency: 'USDT',
    receiveAmount: 5148,
    receiveCurrency: 'MXN',
    recipientName: 'Carlos Rivera',
    recipientPhone: '+52 55 1234 5678',
    recipientAccountType: 'bank',
    recipientAccountLabel: 'Banorte',
    fee: 3.0,
    rate: 17.16,
    depositAddress: '0x2f9A3e8B1c4D7a6E5f0B8c1D9e3F2a4B6c5D7e',
    depositNetwork: 'Polygon',
    corridorId: 'us-mx',
    corridorDisplay: '🇺🇸→🇲🇽',
    processorId: 'processor_002',
    settlementProofUrl: 'https://example.com/receipt/67890.jpg',
    settlementProofType: 'receipt_image',
    payerId: 'user_004',
    createdAt: new Date(now - 24 * hour).toISOString(),
    updatedAt: new Date(now - 20 * hour).toISOString(),
    expiresAt: new Date(now + 6 * hour).toISOString(),
    completedAt: new Date(now - 20 * hour).toISOString(),
  },
  {
    id: 'txn_seed_006',
    slug: 'QP-C1N8V3',
    status: 'COMPLETED',
    sendAmount: 250,
    sendCurrency: 'USDT',
    receiveAmount: 20875,
    receiveCurrency: 'INR',
    recipientName: 'Priya Sharma',
    recipientPhone: '+91 98765 43210',
    recipientAccountType: 'bank',
    recipientAccountLabel: 'HDFC Bank',
    fee: 3.0,
    rate: 83.5,
    depositAddress: '0x4c2A9f8E3d7B6a1C0e5F2d8A9b4C7e6F3a1D5b',
    depositNetwork: 'Polygon',
    corridorId: 'uk-in',
    corridorDisplay: '🇬🇧→🇮🇳',
    processorId: 'processor_001',
    settlementProofUrl: 'TXN_REF_HDFC_789456',
    settlementProofType: 'reference_number',
    payerId: 'user_005',
    createdAt: new Date(now - 36 * hour).toISOString(),
    updatedAt: new Date(now - 32 * hour).toISOString(),
    expiresAt: new Date(now - 6 * hour).toISOString(),
    completedAt: new Date(now - 32 * hour).toISOString(),
  },
  {
    id: 'txn_seed_007',
    slug: 'QP-D4H6J9',
    status: 'DEPOSIT_CONFIRMED',
    sendAmount: 75,
    sendCurrency: 'USDT',
    receiveAmount: 1128,
    receiveCurrency: 'GHS',
    recipientName: 'Kwame Mensah',
    recipientPhone: '+233 20 123 4567',
    recipientAccountType: 'mobile_money',
    recipientAccountLabel: 'MTN MoMo',
    fee: 1.12,
    rate: 15.04,
    depositAddress: '0x1e8B4f7A2c9D3e6F5a0B8c1D4e7F9a2B5c3D6e',
    depositNetwork: 'Base',
    corridorId: 'sg-gh',
    corridorDisplay: '🇸🇬→🇬🇭',
    payerId: 'user_006',
    createdAt: new Date(now - 1 * hour).toISOString(),
    updatedAt: new Date(now - 0.5 * hour).toISOString(),
    expiresAt: new Date(now + 29 * hour).toISOString(),
  },
];

interface TransactionState {
  transactions: TransactionDetail[];
  addTransaction: (tx: TransactionDetail) => void;
  updateStatus: (id: string, status: TransactionStatus) => void;
  updateProof: (
    id: string,
    proofUrl: string,
    proofType: ProofType,
    notes?: string
  ) => void;
  setProcessorId: (id: string, processorId: string) => void;
  getTransaction: (idOrSlug: string) => TransactionDetail | undefined;
  getStreamTransactions: () => TransactionDetail[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: seedTransactions,

  addTransaction: (tx: TransactionDetail) => {
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }));
  },

  updateStatus: (id: string, status: TransactionStatus) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status,
              updatedAt: new Date().toISOString(),
              ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
            }
          : tx
      ),
    }));
  },

  updateProof: (
    id: string,
    proofUrl: string,
    proofType: ProofType,
    notes?: string
  ) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              settlementProofUrl: proofUrl,
              settlementProofType: proofType,
              settlementNotes: notes,
              status: 'SETTLEMENT_PROOF_UPLOADED' as TransactionStatus,
              updatedAt: new Date().toISOString(),
            }
          : tx
      ),
    }));
  },

  setProcessorId: (id: string, processorId: string) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              processorId,
              updatedAt: new Date().toISOString(),
            }
          : tx
      ),
    }));
  },

  getTransaction: (idOrSlug: string) => {
    const { transactions } = get();
    return transactions.find((tx) => tx.id === idOrSlug || tx.slug === idOrSlug);
  },

  getStreamTransactions: () => {
    const { transactions } = get();
    return [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));

export { generateSlug, generateId };

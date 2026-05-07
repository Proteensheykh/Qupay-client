import type { TransactionStatus, StatusGroup } from '../types/transaction';

const LEGACY_STATUS_MAP: Record<string, TransactionStatus> = {
  INITIATED: 'QUEUED',
  MATCHING: 'QUEUED',
  AWAITING_DEPOSIT: 'IN_PROGRESS',
  ESCROW_FUNDED: 'IN_PROGRESS',
  MP_PROCESSING: 'PAYER_PAID',
  AWAITING_CONFIRMATION: 'PAYER_PAID',
  SETTLING: 'PAYER_PAID',
  RESOLVED: 'COMPLETE',
  REFUNDED: 'CANCELLED',
};

const loggedUnknown = new Set<string>();

export function normalizeStatus(raw: string): TransactionStatus {
  const canonical: TransactionStatus[] = [
    'QUEUED', 'IN_PROGRESS', 'PAYER_PAID', 'COMPLETE', 'CANCELLED', 'EXPIRED', 'DISPUTED',
  ];

  if (canonical.includes(raw as TransactionStatus)) {
    return raw as TransactionStatus;
  }

  const mapped = LEGACY_STATUS_MAP[raw];
  if (mapped) return mapped;

  if (!loggedUnknown.has(raw)) {
    loggedUnknown.add(raw);
    console.warn(`[transactionStatus] Unknown status "${raw}" — defaulting to QUEUED`);
  }
  return 'QUEUED';
}

export function toStatusGroup(status: TransactionStatus): StatusGroup {
  switch (status) {
    case 'QUEUED':
      return 'PENDING';
    case 'IN_PROGRESS':
    case 'PAYER_PAID':
      return 'IN_PROGRESS';
    case 'COMPLETE':
      return 'COMPLETED';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'DISPUTED':
      return 'FAILED';
  }
}

export function isTerminalStatus(status: TransactionStatus): boolean {
  return status === 'COMPLETE' || status === 'CANCELLED' || status === 'EXPIRED' || status === 'DISPUTED';
}

export function getPollingInterval(status: TransactionStatus): number | false {
  switch (status) {
    case 'QUEUED':
    case 'IN_PROGRESS':
      return 5000;
    case 'PAYER_PAID':
      return 10000;
    default:
      return false;
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  raw?: unknown;

  constructor(message: string, status: number, raw?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.raw = raw;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const KNOWN_MESSAGES: Record<string, string> = {
  'Transaction must be IN_PROGRESS before confirming transfer':
    'This transaction can no longer be confirmed.',
  'This transaction does not belong to you':
    'You don\u2019t have permission to update this transaction.',
  'Transaction has already been claimed by another MP':
    'Another processor already accepted this transaction.',
  'You need a Solana wallet configured to accept USDT transactions':
    'Please add a Solana wallet before accepting USDT orders.',
  'You need bank account details configured to accept fiat transactions':
    'Please add a bank account before accepting NGN orders.',
  'KYC verification required before going online':
    'Complete your KYC verification to go online.',
  'Your account is suspended and cannot go online':
    'Your account is suspended. Contact support for assistance.',
  'Configure at least one payment method before going online':
    'Add a wallet or bank account before going online.',
  'MP profile not found. Complete onboarding first: POST /v1/mp/onboard':
    'Complete processor onboarding first.',
  'Quote has expired':
    'Your quote expired. We refreshed it — please confirm again.',
  'Quote not found':
    'Your quote is no longer valid. We refreshed it — please confirm again.',
  'Amount does not match quote':
    'The amount changed. We refreshed your quote — please confirm again.',
  'Duplicate transaction':
    'This transfer is already being processed.',
};

const GENERIC_FALLBACK = 'Something went wrong. Please try again.';

interface ApiErrorLike {
  status?: number;
  message?: string;
}

/**
 * The client and this module each declare an `ApiError`; the interceptor throws
 * the client's. Duck-type on `status` so message mapping works for either.
 */
function asApiErrorLike(error: unknown): ApiErrorLike | null {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && typeof (error as ApiErrorLike).status === 'number') {
    return error as ApiErrorLike;
  }
  return null;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return asApiErrorLike(error)?.status;
}

export function getApiErrorMessage(error: unknown): string {
  const apiError = asApiErrorLike(error);
  if (apiError) {
    if (apiError.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    const mapped = apiError.message ? KNOWN_MESSAGES[apiError.message] : undefined;
    if (mapped) return mapped;
    if (apiError.message && apiError.message !== 'Network error') return apiError.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return GENERIC_FALLBACK;
}

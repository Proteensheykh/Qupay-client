import { apiClient } from './client';
import type { Tier } from './kyc';

export type AmountType = 'SEND' | 'RECEIVE';

export interface QuoteRequest {
  amount: number;
  sendCurrency: string;
  receiveCurrency: string;
  amountType?: AmountType;
}

export interface QuoteResponse {
  quoteId: string;
  enteredAmount: number;
  fee: number;
  totalToSend: number;
  rate: number;
  receiveAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  tier: Tier;
  spreadRate: number;
  rateTimestamp: string;
  expiresAt: string;
}

/**
 * Requests a locked quote for a transfer. The quote pins the fee, rate, and
 * totals for a short window (120s) so amounts cannot drift between the confirm
 * screen and submit. Create a transaction by `quoteId` before it expires.
 */
export async function calculateQuote(
  request: QuoteRequest
): Promise<QuoteResponse> {
  const response = await apiClient.post<QuoteResponse>(
    '/v1/quotes/calculate',
    request
  );
  return response.data;
}

import { useMutation } from '@tanstack/react-query';
import { calculateQuote, type QuoteRequest, type QuoteResponse } from '../api/quotes';

/**
 * Requests a locked quote imperatively. Modeled as a mutation (not a query)
 * because quotes are short-lived (120s TTL) and must be re-requested on demand
 * — on Confirm mount and on expiry/410 re-quote.
 */
export function useCalculateQuote() {
  return useMutation<QuoteResponse, unknown, QuoteRequest>({
    mutationFn: (request: QuoteRequest) => calculateQuote(request),
  });
}

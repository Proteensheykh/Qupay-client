import { apiClient } from './client';

export interface BankResponse {
  bankCode: string;
  bankName: string;
  nipBankCode?: string;
  ussdCode?: string;
}

export interface ValidateBankAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface BankAccountData {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export async function getBanks(): Promise<BankResponse[]> {
  const response = await apiClient.get<BankResponse[]>('/v1/banks');
  return response.data;
}

export async function validateBankAccount(
  request: ValidateBankAccountRequest
): Promise<BankAccountData> {
  const response = await apiClient.post<BankAccountData>('/v1/banks/validate', request);
  return response.data;
}

/**
 * Resolves a bank code to its human-readable name. Transactions returned by the
 * backend carry only `bankCode`, so receipts look up the display name here.
 */
export function findBankName(
  banks: BankResponse[] | undefined,
  bankCode: string | null | undefined
): string | undefined {
  if (!bankCode || !banks) return undefined;
  return banks.find((b) => b.bankCode === bankCode)?.bankName;
}

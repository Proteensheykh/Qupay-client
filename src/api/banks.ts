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

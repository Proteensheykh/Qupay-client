import { apiClient } from './client';
import type {
  BindBankAccountRequest,
  BindCryptoWalletRequest,
  BankAccountResponse,
  CryptoWalletResponse,
  PublicProfileResponse,
} from '../types/auth';

export async function bindBankAccount(
  request: BindBankAccountRequest
): Promise<BankAccountResponse> {
  const response = await apiClient.post<BankAccountResponse>(
    '/v1/users/me/bank-account',
    request
  );
  return response.data;
}

export async function bindCryptoWallet(
  request: BindCryptoWalletRequest
): Promise<CryptoWalletResponse> {
  const response = await apiClient.post<CryptoWalletResponse>(
    '/v1/users/me/crypto-wallet',
    request
  );
  return response.data;
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfileResponse> {
  const response = await apiClient.get<PublicProfileResponse>(
    `/v1/users/${encodeURIComponent(username)}`
  );
  return response.data;
}

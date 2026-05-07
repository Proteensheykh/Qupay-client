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

export interface BindWalletRequest {
  walletAddress: string;
}

export interface WalletResponse {
  walletAddress: string;
}

export async function bindPrimaryWallet(
  request: BindWalletRequest
): Promise<WalletResponse> {
  const response = await apiClient.put<WalletResponse>(
    '/v1/users/me/wallet',
    request
  );
  return response.data;
}

export interface BindMobileMoneyRequest {
  provider: string;
  mobileNumber: string;
}

export interface MobileMoneyResponse {
  provider: string;
  mobileNumber: string;
}

export async function bindMobileMoney(
  request: BindMobileMoneyRequest
): Promise<MobileMoneyResponse> {
  const response = await apiClient.put<MobileMoneyResponse>(
    '/v1/users/me/mobile-money',
    request
  );
  return response.data;
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfileResponse> {
  const response = await apiClient.get<PublicProfileResponse>(
    `/v1/users/by-username/${encodeURIComponent(username)}`
  );
  return response.data;
}

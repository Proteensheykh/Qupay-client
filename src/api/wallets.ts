import { apiClient } from './client';
import type { CryptoNetwork } from '../types/auth';

export interface ValidateWalletRequest {
  address: string;
  network: CryptoNetwork;
}

export interface WalletValidationResult {
  valid: boolean;
  address: string;
  network: CryptoNetwork;
}

export async function validateWallet(
  request: ValidateWalletRequest
): Promise<WalletValidationResult> {
  const response = await apiClient.post<WalletValidationResult>(
    '/v1/wallets/validate',
    request
  );
  return response.data;
}

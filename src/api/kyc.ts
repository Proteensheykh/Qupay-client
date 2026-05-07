import { apiClient } from './client';
import type { KycStatus } from '../types/auth';

export interface KycSubmissionRequest {
  bvn: string;
  nin: string;
  dateOfBirth: string;
}

export interface KycStatusResponse {
  status: KycStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export async function submitKyc(
  data: KycSubmissionRequest
): Promise<KycStatusResponse> {
  const response = await apiClient.post<KycStatusResponse>(
    '/v1/users/me/kyc',
    data
  );
  return response.data;
}

export async function getKycStatus(): Promise<KycStatusResponse> {
  const response = await apiClient.get<KycStatusResponse>('/v1/users/me/kyc');
  return response.data;
}

/**
 * Formats a Date into the backend-expected `dd-MMM-yyyy` format (e.g. "12-Jan-1990").
 */
export function formatKycDate(d: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

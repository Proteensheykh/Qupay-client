import { apiClient } from './client';

export type MpStatus = 'ONLINE' | 'OFFLINE' | 'SUSPENDED';
export type BadgeLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export interface LocalTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface MpProfile {
  id: string;
  status: MpStatus;
  usdtBalance: number;
  ngnBalance: number;
  stakedUsdt: number;
  dailyLimit: number;
  badgeLevel: BadgeLevel;
  operatingHoursStart: LocalTime | null;
  operatingHoursEnd: LocalTime | null;
}

export interface OnboardMpRequest {
  stakedUsdt: number;
  operatingHoursStart: LocalTime;
  operatingHoursEnd: LocalTime;
  mobileMoneyNumber: string;
}

export interface UpdateMpBalancesRequest {
  usdtBalance: number;
  ngnBalance: number;
}

export async function getMpProfile(): Promise<MpProfile> {
  const response = await apiClient.get<MpProfile>('/v1/mp/me');
  return response.data;
}

export async function setOnline(): Promise<void> {
  await apiClient.post('/v1/mp/me/online');
}

export async function setOffline(): Promise<void> {
  await apiClient.post('/v1/mp/me/offline');
}

export async function onboardMp(data: OnboardMpRequest): Promise<MpProfile> {
  const response = await apiClient.post<MpProfile>('/v1/mp/onboard', data);
  return response.data;
}

export async function updateMpBalances(
  data: UpdateMpBalancesRequest
): Promise<MpProfile> {
  const response = await apiClient.put<MpProfile>('/v1/mp/me/balances', data);
  return response.data;
}

export function toLocalTime(hour: number, minute: number): LocalTime {
  return { hour, minute, second: 0, nano: 0 };
}

import { apiClient } from './client';

export interface CurrencyResponse {
  code: string;
  name: string;
}

export interface RateResponse {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  source: string;
  fetchedAt: string;
  tier?: string;
  spreadRate?: number;
  effectiveRate?: number;
}

export async function getCurrencies(): Promise<CurrencyResponse[]> {
  const response = await apiClient.get<CurrencyResponse[]>('/v1/rates/currencies');
  return response.data;
}

export async function getRate(from: string, to: string): Promise<RateResponse> {
  const response = await apiClient.get<RateResponse>('/v1/rates/convert', {
    params: { from, to },
  });
  return response.data;
}

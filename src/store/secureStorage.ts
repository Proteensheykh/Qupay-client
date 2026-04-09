import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BANK_DETAILS: 'bank_details',
  WALLET_DETAILS: 'wallet_details',
  USERNAME: 'username',
  PROCESSOR_PROMO_DISMISSED: 'processor_promo_dismissed',
  THEME_PREFERENCE: 'theme_preference',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

const isWeb = Platform.OS === 'web';

export async function setItem(key: StorageKey, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItem(key: StorageKey): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

export async function deleteItem(key: StorageKey): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    deleteItem(StorageKeys.ACCESS_TOKEN),
    deleteItem(StorageKeys.REFRESH_TOKEN),
    deleteItem(StorageKeys.USER_DATA),
    deleteItem(StorageKeys.BANK_DETAILS),
    deleteItem(StorageKeys.WALLET_DETAILS),
    deleteItem(StorageKeys.USERNAME),
  ]);
}

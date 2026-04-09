import { create } from 'zustand';
import type { AuthTokenResponse, UserProfileResponse } from '../types/auth';
import { serverLogout } from '../api/auth';
import * as storage from './secureStorage';
import { StorageKeys } from './secureStorage';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
}

export interface WalletDetails {
  address: string;
  network: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isPinLocked: boolean;
  bankDetails: BankDetails | null;
  walletDetails: WalletDetails | null;
  username: string | null;

  setTokens: (tokens: AuthTokenResponse) => Promise<void>;
  setUser: (user: UserProfileResponse, lockIfPinSet?: boolean) => void;
  setPinLocked: (value: boolean) => void;
  setBankDetails: (details: BankDetails | null) => void;
  setWalletDetails: (details: WalletDetails | null) => void;
  setUsername: (username: string | null) => void;
  logout: (skipServerCall?: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isPinLocked: false,
  bankDetails: null,
  walletDetails: null,
  username: null,

  setTokens: async (tokens: AuthTokenResponse) => {
    await storage.setItem(StorageKeys.ACCESS_TOKEN, tokens.accessToken);
    await storage.setItem(StorageKeys.REFRESH_TOKEN, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserProfileResponse, lockIfPinSet = false) => {
    storage.setItem(StorageKeys.USER_DATA, JSON.stringify(user));
    if (lockIfPinSet && user.pinSet) {
      set({ user, isPinLocked: true });
    } else {
      set({ user });
    }
  },

  setPinLocked: (value: boolean) => {
    set({ isPinLocked: value });
  },

  setBankDetails: (details: BankDetails | null) => {
    if (details) {
      storage.setItem(StorageKeys.BANK_DETAILS, JSON.stringify(details));
    } else {
      storage.deleteItem(StorageKeys.BANK_DETAILS);
    }
    set({ bankDetails: details });
  },

  setWalletDetails: (details: WalletDetails | null) => {
    if (details) {
      storage.setItem(StorageKeys.WALLET_DETAILS, JSON.stringify(details));
    } else {
      storage.deleteItem(StorageKeys.WALLET_DETAILS);
    }
    set({ walletDetails: details });
  },

  setUsername: (username: string | null) => {
    if (username) {
      storage.setItem(StorageKeys.USERNAME, username);
    } else {
      storage.deleteItem(StorageKeys.USERNAME);
    }
    set({ username });
  },

  logout: async (skipServerCall = false) => {
    const { refreshToken } = get();
    
    if (refreshToken && !skipServerCall) {
      try {
        await serverLogout({ refreshToken });
      } catch {
        // Ignore errors - we're logging out anyway
      }
    }

    await storage.clearAll();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isPinLocked: false,
      bankDetails: null,
      walletDetails: null,
      username: null,
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userDataStr, bankDetailsStr, walletDetailsStr, username] = await Promise.all([
        storage.getItem(StorageKeys.ACCESS_TOKEN),
        storage.getItem(StorageKeys.REFRESH_TOKEN),
        storage.getItem(StorageKeys.USER_DATA),
        storage.getItem(StorageKeys.BANK_DETAILS),
        storage.getItem(StorageKeys.WALLET_DETAILS),
        storage.getItem(StorageKeys.USERNAME),
      ]);

      let user: UserProfileResponse | null = null;
      let bankDetails: BankDetails | null = null;
      let walletDetails: WalletDetails | null = null;

      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr) as UserProfileResponse;
        } catch {
          user = null;
        }
      }

      if (bankDetailsStr) {
        try {
          bankDetails = JSON.parse(bankDetailsStr) as BankDetails;
        } catch {
          bankDetails = null;
        }
      }

      if (walletDetailsStr) {
        try {
          walletDetails = JSON.parse(walletDetailsStr) as WalletDetails;
        } catch {
          walletDetails = null;
        }
      }

      const isAuthenticated = !!accessToken;
      const hasPin = user?.pinSet ?? false;

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated,
        isPinLocked: isAuthenticated && hasPin,
        isHydrated: true,
        bankDetails,
        walletDetails,
        username,
      });
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      set({ isHydrated: true });
    }
  },
}));

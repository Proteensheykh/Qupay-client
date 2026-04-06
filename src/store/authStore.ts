import { create } from 'zustand';
import type { AuthTokenResponse, UserProfileResponse } from '../types/auth';
import { serverLogout } from '../api/auth';
import * as storage from './secureStorage';
import { StorageKeys } from './secureStorage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isPinLocked: boolean;

  setTokens: (tokens: AuthTokenResponse) => Promise<void>;
  setUser: (user: UserProfileResponse, lockIfPinSet?: boolean) => void;
  setPinLocked: (value: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isPinLocked: false,

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

  logout: async () => {
    const { refreshToken } = get();
    
    if (refreshToken) {
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
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userDataStr] = await Promise.all([
        storage.getItem(StorageKeys.ACCESS_TOKEN),
        storage.getItem(StorageKeys.REFRESH_TOKEN),
        storage.getItem(StorageKeys.USER_DATA),
      ]);

      let user: UserProfileResponse | null = null;

      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr) as UserProfileResponse;
        } catch {
          user = null;
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
      });
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      set({ isHydrated: true });
    }
  },
}));

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const secureStorage: StateStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(name);
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export interface BankRecipient {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface WalletRecipient {
  walletAddress: string;
  network: string;
  username?: string;
}

export interface RecentRecipient {
  id: string;
  channel: 'bank' | 'wallet';
  label: string;
  data: BankRecipient | WalletRecipient;
  lastUsedAt: number;
}

const MAX_RECENTS = 20;

interface RecentRecipientsState {
  recents: RecentRecipient[];
  add: (r: Omit<RecentRecipient, 'id' | 'lastUsedAt'>) => void;
  remove: (id: string) => void;
}

function generateId(): string {
  return `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useRecentRecipientsStore = create<RecentRecipientsState>()(
  persist(
    (set, get) => ({
      recents: [],

      add: (r) => {
        const { recents } = get();
        const existing = recents.find((existing) => {
          if (existing.channel !== r.channel) return false;
          if (r.channel === 'bank') {
            const a = existing.data as BankRecipient;
            const b = r.data as BankRecipient;
            return a.bankCode === b.bankCode && a.accountNumber === b.accountNumber;
          }
          const a = existing.data as WalletRecipient;
          const b = r.data as WalletRecipient;
          return a.walletAddress === b.walletAddress;
        });

        if (existing) {
          set({
            recents: recents.map((item) =>
              item.id === existing.id
                ? { ...item, lastUsedAt: Date.now(), label: r.label }
                : item
            ),
          });
        } else {
          const newRecent: RecentRecipient = {
            ...r,
            id: generateId(),
            lastUsedAt: Date.now(),
          };
          const updated = [newRecent, ...recents].slice(0, MAX_RECENTS);
          set({ recents: updated });
        }
      },

      remove: (id) => {
        set({ recents: get().recents.filter((r) => r.id !== id) });
      },
    }),
    {
      name: 'qupay-recent-recipients',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { useAuthStore } from '../store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const setPinLocked = useAuthStore((state) => state.setPinLocked);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hasPin = user?.pinSet ?? false;
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated && hasPin) {
          setPinLocked(true);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, hasPin, setPinLocked]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

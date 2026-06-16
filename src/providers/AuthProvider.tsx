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
  const validateSession = useAuthStore((state) => state.validateSession);
  const user = useAuthStore((state) => state.user);
  const hasPin = user?.pinSet ?? false;
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isValidating = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated && hasPin && !isValidating.current) {
          isValidating.current = true;
          const stillValid = await validateSession();
          isValidating.current = false;
          if (stillValid) {
            setPinLocked(true);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, hasPin, setPinLocked, validateSession]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

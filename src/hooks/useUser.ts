import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getProfile } from '../api/auth';
import { queryClient } from '../api/queryClient';
import { queryKeys } from '../api/queryKeys';
import { useAuthStore } from '../store/authStore';
import type { UserProfileResponse } from '../types/auth';

export function useUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const cachedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data, isLoading, error, refetch } = useQuery<UserProfileResponse>({
    queryKey: queryKeys.user.me(),
    queryFn: async () => {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 1000 * 60 * 5,
    placeholderData: cachedUser ?? undefined,
  });

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
  }, [queryClient]);

  return {
    user: data ?? cachedUser,
    isLoading: isLoading && !data && !cachedUser,
    error,
    refetch,
    invalidate,
  };
}

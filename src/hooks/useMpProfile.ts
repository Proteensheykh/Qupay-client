import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMpProfile,
  setOnline,
  setOffline,
  onboardMp,
  updateMpBalances,
  type OnboardMpRequest,
  type UpdateMpBalancesRequest,
} from '../api/mp';
import { queryKeys } from '../api/queryKeys';

export function useMpProfile() {
  return useQuery({
    queryKey: queryKeys.mp.profile(),
    queryFn: getMpProfile,
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleMpStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goOnline: boolean) =>
      goOnline ? setOnline() : setOffline(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.profile() });
    },
  });
}

export function useOnboardMp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OnboardMpRequest) => onboardMp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
}

export function useUpdateMpBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMpBalancesRequest) => updateMpBalances(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.profile() });
    },
  });
}

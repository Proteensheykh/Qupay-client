import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKycStatus, submitKyc, type KycSubmissionRequest } from '../api/kyc';
import { queryKeys } from '../api/queryKeys';

export function useKycStatus() {
  return useQuery({
    queryKey: queryKeys.kyc.status(),
    queryFn: getKycStatus,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KycSubmissionRequest) => submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
}

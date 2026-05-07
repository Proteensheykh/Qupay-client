import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyOrders, uploadProof, type UploadProofRequest } from '../api/mpOrders';
import { queryKeys } from '../api/queryKeys';

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.mp.myOrders(),
    queryFn: getMyOrders,
    staleTime: 1000 * 30,
  });
}

export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UploadProofRequest }) =>
      uploadProof(orderId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.myOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byId(variables.orderId) });
    },
  });
}

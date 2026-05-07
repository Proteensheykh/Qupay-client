import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, acceptOrder } from '../api/mpOrders';
import { queryKeys } from '../api/queryKeys';

export function useMpQueue() {
  return useQuery({
    queryKey: queryKeys.mp.queue(),
    queryFn: getQueue,
    refetchInterval: 10_000,
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => acceptOrder(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.queue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.myOrders() });
    },
  });
}

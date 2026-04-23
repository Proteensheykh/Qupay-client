import React, { useState, useCallback } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '../theme';
import { palette } from '../theme/colors';

interface UsePullToRefreshResult {
  refreshing: boolean;
  refreshControl: React.ReactElement<RefreshControlProps>;
}

export const usePullToRefresh = (
  onRefreshCallback?: () => Promise<void> | void
): UsePullToRefreshResult => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefreshCallback?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshCallback]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={palette.royal[500]}
      colors={[palette.royal[500]]}
      progressBackgroundColor={theme.background.surface}
    />
  );

  return { refreshing, refreshControl };
};

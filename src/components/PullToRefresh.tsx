import React, { useState, useCallback } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '../theme';

interface UsePullToRefreshResult {
  refreshing: boolean;
  refreshControl: React.ReactElement<RefreshControlProps>;
}

export const usePullToRefresh = (onRefreshCallback?: () => void): UsePullToRefreshResult => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    onRefreshCallback?.();
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [onRefreshCallback]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.secondary.main}
      colors={[theme.secondary.main]}
      progressBackgroundColor={theme.background.surface}
    />
  );

  return { refreshing, refreshControl };
};

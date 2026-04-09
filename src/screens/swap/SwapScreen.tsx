import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export const SwapScreen: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[s.c, { backgroundColor: theme.background.default }]}>
      <Text style={{ color: theme.text.secondary }}>Deprecated</Text>
    </View>
  );
};

const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

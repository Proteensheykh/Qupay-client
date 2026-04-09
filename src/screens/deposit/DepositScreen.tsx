// Legacy placeholder — no longer used in Qupay navigation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export const DepositScreen: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background.default }]}>
      <Text style={[styles.text, { color: theme.text.secondary }]}>Deprecated</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14 },
});

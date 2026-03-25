// Legacy placeholder — no longer used in Qupay navigation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const DepositScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Deprecated</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111118', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'rgba(255,255,245,0.6)', fontSize: 14 },
});

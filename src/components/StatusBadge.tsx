import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'green' | 'yellow' | 'red';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const bgMap: Record<BadgeVariant, string> = {
  green: 'rgba(0,229,160,0.12)',
  yellow: 'rgba(255,212,96,0.1)',
  red: 'rgba(255,77,106,0.1)',
};

const colorMap: Record<BadgeVariant, string> = {
  green: '#00E5A0',
  yellow: '#FFD460',
  red: '#FF4D6A',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => {
  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant] }]}>
      <Text style={[styles.text, { color: colorMap[variant] }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
});

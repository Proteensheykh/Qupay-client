import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, borderRadius } from '../theme';
import { GradientButton } from './GradientButton';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.emojiCircle, { backgroundColor: theme.background.surface }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[typography.h2, { color: theme.text.primary, textAlign: 'center', marginTop: spacing(4) }]}>
        {title}
      </Text>
      <Text style={[typography.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing(2), paddingHorizontal: spacing(4) }]}>
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <View style={{ marginTop: spacing(5) }}>
          <GradientButton title={actionLabel} onPress={onAction} size="medium" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(6),
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
});

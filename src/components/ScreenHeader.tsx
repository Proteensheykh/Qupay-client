import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BackButton } from './BackButton';
import { useTheme, spacing, typography } from '../theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  right,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      {onBack ? <BackButton onPress={onBack} /> : <View style={styles.spacer} />}
      <Text
        style={[typography.h3, { color: theme.text.primary, flex: 1 }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {right ? right : <View style={styles.spacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4.5),
    paddingBottom: spacing(3),
  },
  spacer: {
    width: 44,
    height: 44,
  },
});

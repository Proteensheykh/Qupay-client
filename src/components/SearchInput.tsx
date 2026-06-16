import React, { useMemo, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from './Icon';
import { typography, spacing, useTheme } from '../theme';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderStyle = useMemo(
    () => (focused ? borders.focus : { borderWidth: 1, borderColor: 'transparent' }),
    [focused]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.surface },
        borderStyle,
      ]}
    >
      <Ionicons name="search" size={18} color={theme.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.text.muted}
        selectionColor={palette.royal[500]}
        cursorColor={palette.royal[500]}
        style={[typography.body, styles.input, { color: theme.text.primary }]}
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    gap: spacing(2),
    minHeight: 52,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});

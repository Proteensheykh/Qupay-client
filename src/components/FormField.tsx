import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { Ionicons } from './Icon';
import { useTheme } from '../theme';

interface FormFieldProps extends TextInputProps {
  label?: string;
  isValid?: boolean;
  showCheck?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  isValid = false,
  showCheck = true,
  leftIcon,
  rightIcon,
  error,
  style,
  ...inputProps
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  const borderColor = useMemo(() => {
    if (hasError) return `${theme.error.main}99`;
    if (isValid) return `${theme.secondary.main}80`;
    if (focused) return `${theme.secondary.main}66`;
    return 'transparent';
  }, [hasError, isValid, focused, theme.error.main, theme.secondary.main]);

  return (
    <View>
      {label && <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>}
      <View
        style={[
          styles.field,
          { backgroundColor: theme.background.surface, borderColor },
        ]}
      >
        {leftIcon}
        <TextInput
          style={[styles.input, { color: theme.text.primary }, style]}
          placeholderTextColor={theme.text.muted}
          selectionColor={theme.secondary.main}
          cursorColor={theme.secondary.main}
          underlineColorAndroid="transparent"
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
        {isValid && showCheck && !rightIcon && !hasError && (
          <Ionicons name="checkmark" size={16} color={theme.secondary.main} />
        )}
        {hasError && !rightIcon && (
          <Ionicons name="alert-circle" size={16} color={theme.error.main} />
        )}
        {rightIcon}
      </View>
      {hasError && <Text style={[styles.errorText, { color: theme.error.main }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    // Local inputs sit on dark surfaces with no visible border by default —
    // borders only appear on focus / validation states
    borderWidth: 1,
    borderRadius: 12, // R.md
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    paddingVertical: 14,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
      outlineWidth: 0,
    } : {}),
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: 12,
    marginTop: 2,
  },
});

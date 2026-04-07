import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormFieldProps extends TextInputProps {
  label?: string;
  isValid?: boolean;
  showCheck?: boolean;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  isValid = false,
  showCheck = true,
  rightIcon,
  error,
  style,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          isValid && !hasError && styles.fieldValid,
          hasError && styles.fieldError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="rgba(255,255,245,0.4)"
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
          <Ionicons name="checkmark" size={16} color="#00E5A0" />
        )}
        {hasError && !rightIcon && (
          <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
        )}
        {rightIcon}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  fieldFocused: {
    borderColor: 'rgba(0,229,160,0.4)',
  },
  fieldValid: {
    borderColor: 'rgba(0,229,160,0.5)',
  },
  fieldError: {
    borderColor: 'rgba(255,107,107,0.6)',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFF5',
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 12,
    marginTop: 2,
  },
});

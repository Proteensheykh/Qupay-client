import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from './Icon';
import { useTheme, spacing, typography } from '../theme';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';

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

  const borderStyle = useMemo(() => {
    if (hasError) return borders.error;
    if (focused) return borders.focus;
    if (isValid) return { borderWidth: 1, borderColor: `${palette.royal[500]}80` };
    return { borderWidth: 1, borderColor: 'transparent' };
  }, [hasError, isValid, focused]);

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          { backgroundColor: palette.grey[900] },
          borderStyle,
        ]}
      >
        {leftIcon}
        <TextInput
          style={[styles.input, { color: palette.grey[300] }, style]}
          placeholderTextColor={palette.grey[600]}
          selectionColor={palette.royal[500]}
          cursorColor={palette.royal[500]}
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
          <Ionicons name="checkmark" size={16} color={palette.royal[500]} />
        )}
        {hasError && !rightIcon && (
          <Ionicons name="alert-circle" size={16} color={palette.status.negative} />
        )}
        {rightIcon}
      </View>
      {hasError && (
        <Text style={[styles.errorText, { color: theme.error.main }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    marginBottom: spacing(2),
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: spacing(4),
    gap: spacing(2),
    marginBottom: spacing(3),
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...typography.main16,
    paddingVertical: spacing(3.5),
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none' as const,
          outlineWidth: 0,
        }
      : {}),
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: spacing(3),
    marginTop: spacing(0.5),
  },
});

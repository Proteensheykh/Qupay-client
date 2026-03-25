import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useHaptics } from '../hooks/useHaptics';

interface HapticButtonProps extends TouchableOpacityProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  hapticType = 'light',
  onPress,
  children,
  ...props
}) => {
  const haptics = useHaptics();

  const handlePress = (e: any) => {
    haptics[hapticType]();
    onPress?.(e);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
};

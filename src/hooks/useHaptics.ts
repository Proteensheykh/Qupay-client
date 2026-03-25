import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useHaptics = () => {
  const isIOS = Platform.OS === 'ios';

  const light = () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const medium = () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const heavy = () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const success = () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const error = () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const selection = () => {
    if (isIOS) Haptics.selectionAsync();
  };

  return { light, medium, heavy, success, error, selection };
};

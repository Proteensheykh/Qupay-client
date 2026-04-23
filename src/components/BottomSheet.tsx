import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { palette } from '../theme/colors';
import { borders } from '../theme/elevation';
import { radii } from '../theme/radii';
import { useTheme, springs, durations } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { theme, mode } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        translateY.value = 0;
        backdropOpacity.value = 1;
      } else {
        translateY.value = withSpring(0, springs.gentle);
        backdropOpacity.value = withTiming(1, { duration: durations.base });
      }
    } else {
      if (reduceMotion) {
        translateY.value = SCREEN_HEIGHT;
        backdropOpacity.value = 0;
      } else {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: durations.base,
        });
        backdropOpacity.value = withTiming(0, { duration: durations.fast });
      }
    }
  }, [visible, reduceMotion]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close sheet"
            accessibilityRole="button"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor:
                mode === 'dark' ? palette.grey[900] : theme.background.paper,
              borderTopWidth: borders.hairline.dark.borderWidth,
              borderTopColor:
                mode === 'dark'
                  ? borders.hairline.dark.borderColor
                  : borders.hairline.light.borderColor,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 0,
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.text.disabled }]}
          />
          {title ? (
            <Text
              style={[styles.title, { color: theme.text.primary }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
          ) : null}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.44,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  content: {
    paddingBottom: 40,
  },
});

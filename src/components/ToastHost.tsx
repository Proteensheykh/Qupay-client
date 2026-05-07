import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, Toast, ToastType } from '../store/toastStore';
import { palette } from '../theme/colors';

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#0d2818', border: '#166534', text: '#4ade80' },
  error: { bg: '#2d0f0f', border: '#991b1b', text: '#fca5a5' },
  info: { bg: '#0f1d2d', border: '#1e40af', text: '#93c5fd' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => dismiss(toast.id));
    }, toast.durationMs);

    return () => clearTimeout(timer);
  }, [dismiss, opacity, toast.durationMs, toast.id, translateY]);

  const colors = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.bg, borderColor: colors.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.toastInner}
        onPress={() => dismiss(toast.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.toastTitle, { color: colors.text }]}>{toast.title}</Text>
        {toast.body ? (
          <Text style={[styles.toastBody, { color: palette.grey[400] }]}>{toast.body}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastHost() {
  const queue = useToastStore((s) => s.queue);
  const insets = useSafeAreaInsets();

  if (queue.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {queue.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    ...Platform.select({
      web: { position: 'fixed' as any },
    }),
  },
  toast: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  toastInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toastTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  toastBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});

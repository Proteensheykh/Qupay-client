import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { QupayLogo, CTAButton } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { palette } from '../../theme/colors';
import { typography } from '../../theme';

export const SuspendedScreen: React.FC = () => {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <QupayLogo size={22} />
        </View>

        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: `${palette.status.negative}15` }]}>
            <Ionicons name="ban-outline" size={48} color={palette.status.negative} />
          </View>
          <Text style={[styles.title, { color: palette.grey[900] }]}>
            Account Suspended
          </Text>
          <Text style={[styles.message, { color: palette.grey[500] }]}>
            Your account has been suspended. If you believe this is an error,
            please contact support for assistance.
          </Text>
        </View>

        <View style={styles.footer}>
          <CTAButton
            title="Contact Support"
            onPress={() => {}}
            ghost
          />
          <CTAButton
            title="Sign Out"
            onPress={handleLogout}
            danger
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  header: { paddingHorizontal: 24, paddingTop: 18 },
  body: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...typography.h3,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySm,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

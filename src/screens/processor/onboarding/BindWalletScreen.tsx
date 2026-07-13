import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, CTAButton, FormField } from '../../../components';
import { Ionicons } from '../../../components/Icon';
import { bindPrimaryWallet } from '../../../api/users';
import { validateWallet } from '../../../api/wallets';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../hooks/useUser';
import { getApiErrorMessage } from '../../../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../../navigation/AppNavigator';
import { ActivityIndicator } from 'react-native';
import { palette } from '../../../theme/colors';
import { radii } from '../../../theme/radii';
import { borders } from '../../../theme/elevation';
import { typography } from '../../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'BindWallet'>;

const SOLANA_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const BindWalletScreen: React.FC<Props> = ({ navigation }) => {
  const toast = useToast();
  const { user, invalidate } = useUser();
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress ?? '');
  const [loading, setLoading] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState('');

  const isFormatValid = SOLANA_BASE58.test(walletAddress);
  const alreadyBound = !!user?.walletAddress;

  const handleValidate = useCallback(async () => {
    if (!isFormatValid) return;

    setValidationState('validating');
    setValidationError('');

    try {
      const result = await validateWallet({ address: walletAddress, network: 'SOLANA' });
      if (result.valid) {
        setValidationState('valid');
      } else {
        setValidationError('This wallet address could not be verified');
        setValidationState('invalid');
      }
    } catch (error) {
      setValidationError(getApiErrorMessage(error));
      setValidationState('invalid');
    }
  }, [walletAddress, isFormatValid]);

  const handleAddressChange = useCallback((text: string) => {
    setWalletAddress(text);
    if (validationState !== 'idle') {
      setValidationState('idle');
      setValidationError('');
    }
  }, [validationState]);

  const handleAddressBlur = useCallback(() => {
    if (isFormatValid && validationState === 'idle') {
      handleValidate();
    }
  }, [isFormatValid, validationState, handleValidate]);

  const handleSubmit = useCallback(async () => {
    if (validationState !== 'valid') return;
    setLoading(true);
    try {
      await bindPrimaryWallet({ walletAddress });
      await invalidate();
      toast.success('Wallet bound successfully');
      navigation.goBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [walletAddress, validationState, invalidate, toast, navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="Solana Wallet" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
                <Ionicons name="wallet-outline" size={18} color={palette.royal[500]} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: palette.grey[900] }]}>Primary USDT Wallet</Text>
                <Text style={[styles.sectionSub, { color: palette.grey[500] }]}>
                  Solana network only
                </Text>
              </View>
            </View>

            <FormField
              label="Wallet Address"
              placeholder="Enter your Solana wallet address"
              autoCapitalize="none"
              autoCorrect={false}
              value={walletAddress}
              onChangeText={handleAddressChange}
              onBlur={handleAddressBlur}
              maxLength={44}
              isValid={validationState === 'valid'}
              editable={validationState !== 'validating'}
              accessibilityLabel="Solana wallet address"
            />

            {walletAddress.length > 0 && !isFormatValid && (
              <Text style={[styles.errorText, { color: palette.status.negative }]}>
                Must be a valid Solana address (32-44 base58 characters)
              </Text>
            )}
            {validationState === 'validating' && (
              <View style={styles.validationRow}>
                <ActivityIndicator size="small" color={palette.royal[500]} />
                <Text style={[styles.validationText, { color: palette.royal[500] }]}>
                  Verifying wallet address…
                </Text>
              </View>
            )}
            {validationState === 'valid' && (
              <View style={styles.validationRow}>
                <Ionicons name="checkmark-circle" size={14} color={palette.royal[500]} />
                <Text style={[styles.validationText, { color: palette.royal[500] }]}>
                  Verified wallet address
                </Text>
              </View>
            )}
            {validationState === 'invalid' && (
              <View style={styles.validationRow}>
                <Ionicons name="alert-circle" size={14} color={palette.status.negative} />
                <Text style={[styles.validationText, { color: palette.status.negative }]}>
                  {validationError || 'Invalid wallet address'}
                </Text>
              </View>
            )}
          </View>

          {alreadyBound && (
            <View style={[styles.infoCard, { backgroundColor: 'rgba(122,232,112,0.08)', borderColor: palette.grey[300] }]}>
              <Ionicons name="checkmark-circle" size={16} color={palette.status.positive} />
              <Text style={[styles.infoText, { color: palette.grey[400] }]}>
                Current wallet: {user?.walletAddress?.slice(0, 8)}...{user?.walletAddress?.slice(-6)}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomArea, { borderTopColor: palette.material.darkThin }]}>
          <CTAButton
            title={alreadyBound ? 'Update Wallet' : 'Bind Wallet'}
            onPress={handleSubmit}
            disabled={validationState !== 'valid'}
            loading={loading || validationState === 'validating'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  card: { padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTextWrap: { flex: 1, marginLeft: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  sectionSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  errorText: { ...typography.helperText, marginTop: -4, marginBottom: 8 },
  validationRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 4, marginBottom: 8 },
  validationText: { ...typography.helperText },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

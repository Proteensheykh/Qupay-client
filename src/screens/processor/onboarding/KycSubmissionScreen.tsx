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
import { useSubmitKyc, useKycStatus } from '../../../hooks/useKycStatus';
import { useToast } from '../../../hooks/useToast';
import { formatKycDate } from '../../../api/kyc';
import { getApiErrorMessage } from '../../../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../../navigation/AppNavigator';
import { palette } from '../../../theme/colors';
import { radii } from '../../../theme/radii';
import { borders } from '../../../theme/elevation';
import { typography } from '../../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'KycSubmission'>;

function parseDateInput(input: string): Date | null {
  const parts = input.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const d = parseInt(dd, 10);
  const m = parseInt(mm, 10) - 1;
  const y = parseInt(yyyy, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m, d);
  if (date.getDate() !== d || date.getMonth() !== m || date.getFullYear() !== y) return null;
  return date;
}

export const KycSubmissionScreen: React.FC<Props> = ({ navigation }) => {
  const toast = useToast();
  const submitKyc = useSubmitKyc();
  const { data: kycData } = useKycStatus();

  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [dobInput, setDobInput] = useState('');

  const bvnValid = /^\d{11}$/.test(bvn);
  const ninValid = /^\d{11}$/.test(nin);
  const parsedDob = parseDateInput(dobInput);
  const dobValid = parsedDob !== null;
  const allValid = bvnValid && ninValid && dobValid;

  const alreadySubmitted = kycData?.status === 'PENDING' || kycData?.status === 'APPROVED';

  const handleSubmit = useCallback(async () => {
    if (!allValid || !parsedDob) return;
    try {
      await submitKyc.mutateAsync({
        bvn,
        nin,
        dateOfBirth: formatKycDate(parsedDob),
      });
      toast.success('KYC submitted successfully', 'Your information is being reviewed.');
      navigation.goBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [allValid, bvn, nin, parsedDob, submitKyc, toast, navigation]);

  if (alreadySubmitted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
        <ScreenHeader title="KYC Verification" onBack={() => navigation.goBack()} />
        <View style={styles.submitted}>
          <Text style={[styles.submittedTitle, { color: palette.grey[900] }]}>
            {kycData?.status === 'APPROVED' ? 'KYC Approved' : 'KYC Under Review'}
          </Text>
          <Text style={[styles.submittedSub, { color: palette.grey[500] }]}>
            {kycData?.status === 'APPROVED'
              ? 'Your identity has been verified.'
              : 'Your submission is being reviewed. This usually takes 24-48 hours.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="KYC Verification" onBack={() => navigation.goBack()} />
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
          {kycData?.status === 'REJECTED' && (
            <View style={[styles.rejectionCard, { backgroundColor: 'rgba(255,77,91,0.1)', borderColor: palette.status.negative }]}>
              <Text style={[styles.rejectionTitle, { color: palette.status.negative }]}>
                Previous submission rejected
              </Text>
              {kycData.rejectionReason && (
                <Text style={[styles.rejectionReason, { color: palette.grey[400] }]}>
                  {kycData.rejectionReason}
                </Text>
              )}
            </View>
          )}

          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <FormField
              label="BVN (Bank Verification Number)"
              placeholder="Enter your 11-digit BVN"
              keyboardType="number-pad"
              value={bvn}
              onChangeText={(text) => setBvn(text.replace(/\D/g, ''))}
              maxLength={11}
              isValid={bvnValid}
              accessibilityLabel="BVN"
            />

            <FormField
              label="NIN (National Identification Number)"
              placeholder="Enter your 11-digit NIN"
              keyboardType="number-pad"
              value={nin}
              onChangeText={(text) => setNin(text.replace(/\D/g, ''))}
              maxLength={11}
              isValid={ninValid}
              accessibilityLabel="NIN"
            />

            <FormField
              label="Date of Birth"
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              value={dobInput}
              onChangeText={setDobInput}
              isValid={dobValid}
              accessibilityLabel="Date of Birth"
            />
            {dobInput.length > 0 && !dobValid && (
              <Text style={[styles.errorText, { color: palette.status.negative }]}>
                Enter a valid date as DD/MM/YYYY
              </Text>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: 'rgba(158,121,210,0.08)', borderColor: palette.grey[300] }]}>
            <Text style={[styles.infoText, { color: palette.grey[400] }]}>
              Your BVN and NIN will be used for identity verification. This information is kept secure and only used for compliance purposes.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomArea, { borderTopColor: palette.material.darkThin }]}>
          <CTAButton
            title="Submit KYC"
            onPress={handleSubmit}
            disabled={!allValid}
            loading={submitKyc.isPending}
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
  errorText: { ...typography.helperText, marginTop: -4, marginBottom: 8 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  rejectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectionTitle: { ...typography.h4, marginBottom: 4 },
  rejectionReason: { ...typography.bodySm },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  submittedTitle: { ...typography.h3, textAlign: 'center' },
  submittedSub: { ...typography.bodySm, textAlign: 'center' },
});

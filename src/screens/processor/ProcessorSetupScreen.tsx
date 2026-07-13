import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader } from '../../components';
import { useUser } from '../../hooks/useUser';
import { useKycStatus } from '../../hooks/useKycStatus';
import { useMpProfile } from '../../hooks/useMpProfile';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'ProcessorSetup'>;

type StepStatus = 'pending' | 'in_progress' | 'complete';

interface Step {
  key: string;
  title: string;
  description: string;
  icon: string;
  status: StepStatus;
  onPress: () => void;
  disabled: boolean;
}

function statusIcon(status: StepStatus): { name: string; color: string } {
  switch (status) {
    case 'complete':
      return { name: 'checkmark-circle', color: palette.status.positive };
    case 'in_progress':
      return { name: 'ellipse-outline', color: palette.royal[500] };
    default:
      return { name: 'lock-closed-outline', color: palette.grey[600] };
  }
}

export const ProcessorSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const { data: kycData } = useKycStatus();
  const { data: mpProfile } = useMpProfile();

  const kycApproved = kycData?.kycStatus === 'APPROVED';
  const kycPending = kycData?.kycStatus === 'PENDING';
  const walletBound = !!user?.walletAddress;
  const bankBound = (user?.bankAccounts?.length ?? 0) > 0;
  const mpOnboarded = !!mpProfile;

  const steps: Step[] = [
    {
      key: 'kyc',
      title: 'KYC Verification',
      description: kycApproved
        ? 'Identity verified'
        : kycPending
          ? 'Under review (24-48h)'
          : 'Submit BVN, NIN, and date of birth',
      icon: 'person-outline',
      status: kycApproved ? 'complete' : kycPending ? 'in_progress' : 'in_progress',
      onPress: () => navigation.navigate('KycSubmission'),
      disabled: false,
    },
    {
      key: 'wallet',
      title: 'Bind Solana Wallet',
      description: walletBound
        ? `${user!.walletAddress!.slice(0, 8)}...${user!.walletAddress!.slice(-6)}`
        : 'Add your Solana wallet for USDT',
      icon: 'wallet-outline',
      status: walletBound ? 'complete' : kycApproved ? 'in_progress' : 'pending',
      onPress: () => navigation.navigate('BindWallet'),
      disabled: !kycApproved,
    },
    {
      key: 'bank',
      title: 'Bind Bank Account',
      description: bankBound
        ? `${user!.bankAccounts[0].accountName} (${user!.bankAccounts[0].bankName})`
        : 'Add your Nigerian bank account',
      icon: 'business-outline',
      status: bankBound ? 'complete' : (kycApproved && walletBound) ? 'in_progress' : 'pending',
      onPress: () => navigation.navigate('BindBankAccount'),
      disabled: !(kycApproved && walletBound),
    },
    {
      key: 'onboard',
      title: 'MP Details',
      description: mpOnboarded
        ? 'Onboarding complete'
        : 'Stake USDT and set operating hours',
      icon: 'rocket-outline',
      status: mpOnboarded ? 'complete' : (kycApproved && walletBound && bankBound) ? 'in_progress' : 'pending',
      onPress: () => navigation.navigate('MpOnboard'),
      disabled: !(kycApproved && walletBound && bankBound),
    },
  ];

  const completedCount = steps.filter((s) => s.status === 'complete').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="Processor Setup" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header hero */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
            <Ionicons name="swap-horizontal" size={28} color={palette.royal[500]} />
          </View>
          <Text style={[styles.heroTitle, { color: palette.grey[900] }]}>
            Become a Processor
          </Text>
          <Text style={[styles.heroSub, { color: palette.grey[500] }]}>
            Complete {4 - completedCount} step{4 - completedCount !== 1 ? 's' : ''} to start earning by settling transactions
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarBg, { backgroundColor: palette.grey[200] }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: palette.royal[500],
                width: `${(completedCount / 4) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: palette.grey[500] }]}>
          {completedCount} of 4 complete
        </Text>

        {/* Steps */}
        {steps.map((step, idx) => {
          const si = statusIcon(step.status);
          return (
            <TouchableOpacity
              key={step.key}
              style={[
                styles.stepCard,
                { backgroundColor: palette.grey[200] },
                borders.hairline.light,
                { borderRadius: radii.lg },
                step.disabled && styles.stepDisabled,
              ]}
              onPress={step.onPress}
              disabled={step.disabled}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNum, { backgroundColor: step.status === 'complete' ? 'rgba(122,232,112,0.12)' : palette.grey[300] }]}>
                <Text style={[styles.stepNumText, { color: step.status === 'complete' ? palette.status.positive : palette.grey[400] }]}>
                  {idx + 1}
                </Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepTitle, { color: step.disabled ? palette.grey[600] : palette.grey[900] }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDesc, { color: step.disabled ? palette.grey[600] : palette.grey[500] }]}>
                  {step.description}
                </Text>
              </View>
              <Ionicons name={si.name as any} size={22} color={si.color} />
            </TouchableOpacity>
          );
        })}

        {mpOnboarded && (
          <View style={[styles.completeCard, { backgroundColor: 'rgba(122,232,112,0.08)', borderColor: palette.status.positive }]}>
            <Ionicons name="checkmark-circle" size={20} color={palette.status.positive} />
            <Text style={[styles.completeText, { color: palette.grey[900] }]}>
              You're all set! Go to the Process tab to start accepting orders.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { ...typography.h2, textAlign: 'center', marginBottom: 8 },
  heroSub: { ...typography.bodySm, textAlign: 'center', paddingHorizontal: 20 },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: { ...typography.helperText, textAlign: 'center', marginBottom: 24 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  stepDisabled: { opacity: 0.5 },
  stepNum: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  stepBody: { flex: 1 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  stepDesc: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  completeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  completeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
});

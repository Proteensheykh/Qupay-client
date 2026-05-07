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
import { useOnboardMp } from '../../../hooks/useMpProfile';
import { useUser } from '../../../hooks/useUser';
import { useToast } from '../../../hooks/useToast';
import { toLocalTime } from '../../../api/mp';
import { getApiErrorMessage } from '../../../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../../navigation/AppNavigator';
import { palette } from '../../../theme/colors';
import { radii } from '../../../theme/radii';
import { borders } from '../../../theme/elevation';
import { typography } from '../../../theme';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'MpOnboard'>;

export const MpOnboardScreen: React.FC<Props> = ({ navigation }) => {
  const toast = useToast();
  const { user } = useUser();
  const onboardMp = useOnboardMp();

  const [stakedUsdt, setStakedUsdt] = useState('');
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('0');
  const [endHour, setEndHour] = useState('17');
  const [endMinute, setEndMinute] = useState('0');

  const stakeNum = parseFloat(stakedUsdt) || 0;
  const stakeValid = stakeNum >= 100;

  const sH = parseInt(startHour, 10);
  const sM = parseInt(startMinute, 10);
  const eH = parseInt(endHour, 10);
  const eM = parseInt(endMinute, 10);
  const hoursValid =
    !isNaN(sH) && sH >= 0 && sH <= 23 &&
    !isNaN(sM) && sM >= 0 && sM <= 59 &&
    !isNaN(eH) && eH >= 0 && eH <= 23 &&
    !isNaN(eM) && eM >= 0 && eM <= 59;

  const allValid = stakeValid && hoursValid;

  const handleSubmit = useCallback(async () => {
    if (!allValid) return;

    const mobileMoneyNumber = user?.phoneNumber ?? '';

    try {
      await onboardMp.mutateAsync({
        stakedUsdt: stakeNum,
        operatingHoursStart: toLocalTime(sH, sM),
        operatingHoursEnd: toLocalTime(eH, eM),
        mobileMoneyNumber,
      });
      toast.success('MP onboarding complete!', 'You can now go online and start processing.');
      navigation.goBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [allValid, stakeNum, sH, sM, eH, eM, user?.phoneNumber, onboardMp, toast, navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[900] }]} edges={['top']}>
      <ScreenHeader title="MP Onboarding" onBack={() => navigation.goBack()} />
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
          {/* Staked USDT */}
          <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={palette.royal[500]} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: palette.grey[300] }]}>Staked USDT</Text>
                <Text style={[styles.sectionSub, { color: palette.grey[500] }]}>
                  Minimum 100 USDT required
                </Text>
              </View>
            </View>

            <FormField
              label="Amount (USDT)"
              placeholder="100"
              keyboardType="decimal-pad"
              value={stakedUsdt}
              onChangeText={setStakedUsdt}
              isValid={stakeValid}
              accessibilityLabel="Staked USDT amount"
            />
            {stakedUsdt.length > 0 && !stakeValid && (
              <Text style={[styles.errorText, { color: palette.status.negative }]}>
                Minimum stake is 100 USDT
              </Text>
            )}
          </View>

          {/* Operating Hours */}
          <View style={[styles.card, { backgroundColor: palette.grey[800] }, borders.hairline.dark, { borderRadius: radii.lg }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(158,121,210,0.12)' }]}>
                <Ionicons name="time-outline" size={18} color={palette.royal[500]} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: palette.grey[300] }]}>Operating Hours</Text>
                <Text style={[styles.sectionSub, { color: palette.grey[500] }]}>
                  Cannot be changed after onboarding
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: palette.grey[500] }]}>Start Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <FormField
                  label=""
                  placeholder="HH"
                  keyboardType="number-pad"
                  value={startHour}
                  onChangeText={(t) => setStartHour(t.replace(/\D/g, ''))}
                  maxLength={2}
                  accessibilityLabel="Start hour"
                />
              </View>
              <Text style={[styles.timeSep, { color: palette.grey[400] }]}>:</Text>
              <View style={styles.timeField}>
                <FormField
                  label=""
                  placeholder="MM"
                  keyboardType="number-pad"
                  value={startMinute}
                  onChangeText={(t) => setStartMinute(t.replace(/\D/g, ''))}
                  maxLength={2}
                  accessibilityLabel="Start minute"
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: palette.grey[500] }]}>End Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <FormField
                  label=""
                  placeholder="HH"
                  keyboardType="number-pad"
                  value={endHour}
                  onChangeText={(t) => setEndHour(t.replace(/\D/g, ''))}
                  maxLength={2}
                  accessibilityLabel="End hour"
                />
              </View>
              <Text style={[styles.timeSep, { color: palette.grey[400] }]}>:</Text>
              <View style={styles.timeField}>
                <FormField
                  label=""
                  placeholder="MM"
                  keyboardType="number-pad"
                  value={endMinute}
                  onChangeText={(t) => setEndMinute(t.replace(/\D/g, ''))}
                  maxLength={2}
                  accessibilityLabel="End minute"
                />
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: 'rgba(243,175,37,0.08)', borderColor: palette.grey[700] }]}>
            <Ionicons name="information-circle-outline" size={16} color={palette.status.partial} />
            <Text style={[styles.infoText, { color: palette.grey[400] }]}>
              Mobile money is coming soon. Your verified phone number will be used as a placeholder for now.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomArea, { borderTopColor: palette.material.lightThin }]}>
          <CTAButton
            title="Complete Onboarding"
            onPress={handleSubmit}
            disabled={!allValid}
            loading={onboardMp.isPending}
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
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeField: { flex: 1 },
  timeSep: { ...typography.h3, marginTop: -8 },
  errorText: { ...typography.helperText, marginTop: -4, marginBottom: 8 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

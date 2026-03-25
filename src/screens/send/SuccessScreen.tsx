import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CTAButton } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendFlowParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<SendFlowParamList, 'Success'>;

export const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    recipientName = 'Emeka Johnson',
    recipientMethod = 'OPay',
    amount = 200,
    receiveAmount = 329000,
    dest,
  } = route.params || {};

  const symbol = dest?.symbol || '\u20A6';
  const firstName = recipientName.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Success icon */}
          <View style={styles.sucIcon}>
            <Ionicons name="checkmark" size={32} color="#00E5A0" />
          </View>

          <Text style={styles.sucTitle}>Delivered {'\u{1F389}'}</Text>
          <Text style={styles.sucSub}>
            {firstName} received {symbol}
            {receiveAmount.toLocaleString()}.{'\n'}4 mins 11 secs.
          </Text>

          {/* Notification card */}
          <View style={styles.notifCard}>
            <View style={styles.notifIcon}>
              <Text style={styles.notifIconText}>{'\u{1F4AC}'}</Text>
            </View>
            <View style={styles.notifBody}>
              <Text style={styles.notifTitle}>{firstName} was notified</Text>
              <Text style={styles.notifMsg}>
                "Raj sent you {symbol}
                {receiveAmount.toLocaleString()} via Qupay. Check your {recipientMethod} now."
              </Text>
              <View style={styles.notifTag}>
                <Ionicons name="checkmark" size={10} color="#25d366" />
                <Text style={styles.notifTagText}>SMS delivered</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <CTAButton
            title="View receipt"
            onPress={() => {
              navigation.reset({ index: 0, routes: [{ name: 'Recipient' }] });
            }}
            style={styles.receiptBtn}
          />
          <CTAButton
            title="Send another"
            ghost
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Recipient' }] })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  container: { flex: 1, justifyContent: 'center' },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sucIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 2,
    borderColor: '#00E5A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sucTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: '#FFFFF5',
    marginBottom: 8,
  },
  sucSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.6)',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  notifCard: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: { fontSize: 18 },
  notifBody: { flex: 1 },
  notifTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
  },
  notifMsg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.6)',
    marginTop: 2,
    lineHeight: 18,
  },
  notifTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  notifTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#25d366',
  },
  receiptBtn: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
});

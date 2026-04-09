import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenHeader, CTAButton, FormField, BottomSheet, Toast, GradientAvatar } from '../../components';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import { acceptTransaction, uploadSettlementProof } from '../../api/transactions';
import type { TransactionStatus, ProofType } from '../../types/transaction';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<ProcessorStackParamList, 'ProcessorTransactionDetail'>;

const currencySymbols: Record<string, string> = {
  USDT: '',
  NGN: '\u20A6',
  GHS: '\u20B5',
  KES: 'KSh',
  INR: '\u20B9',
  PHP: '\u20B1',
  MXN: '$',
  PKR: 'Rs',
  ZAR: 'R',
};

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING_DEPOSIT: { label: 'Pending Deposit', color: '#FFD460', bgColor: 'rgba(255,212,96,0.12)', icon: 'time-outline' },
  DEPOSIT_CONFIRMED: { label: 'Ready for Settlement', color: '#00E5A0', bgColor: 'rgba(0,229,160,0.12)', icon: 'checkmark-circle-outline' },
  MATCHED: { label: 'Matched', color: '#1A6FFF', bgColor: 'rgba(26,111,255,0.12)', icon: 'link-outline' },
  SETTLEMENT_IN_PROGRESS: { label: 'Settlement In Progress', color: '#FF9F43', bgColor: 'rgba(255,159,67,0.12)', icon: 'hourglass-outline' },
  SETTLEMENT_PROOF_UPLOADED: { label: 'Proof Uploaded', color: '#A855F7', bgColor: 'rgba(168,85,247,0.12)', icon: 'document-attach-outline' },
  COMPLETED: { label: 'Completed', color: '#00E5A0', bgColor: 'rgba(0,229,160,0.12)', icon: 'checkmark-done-outline' },
  FAILED: { label: 'Failed', color: '#FF4D6A', bgColor: 'rgba(255,77,106,0.12)', icon: 'close-circle-outline' },
  EXPIRED: { label: 'Expired', color: '#FF6B6B', bgColor: 'rgba(255,107,107,0.12)', icon: 'timer-outline' },
  DISPUTED: { label: 'Disputed', color: '#FFD460', bgColor: 'rgba(255,212,96,0.12)', icon: 'warning-outline' },
};

const proofTypes: { type: ProofType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'receipt_image', label: 'Receipt/Image', icon: 'image-outline' },
  { type: 'transaction_hash', label: 'Tx Hash', icon: 'link-outline' },
  { type: 'reference_number', label: 'Reference No.', icon: 'document-text-outline' },
];

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const ProcessorTransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId, slug } = route.params;
  const transaction = useTransactionStore((state) => state.getTransaction(transactionId));
  const currentUser = useAuthStore((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [showProofSheet, setShowProofSheet] = useState(false);
  const [selectedProofType, setSelectedProofType] = useState<ProofType>('receipt_image');
  const [proofData, setProofData] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; type: string } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Transaction" onBack={() => navigation.goBack()} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,245,0.3)" />
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = statusConfig[transaction.status];
  const recvSymbol = currencySymbols[transaction.receiveCurrency] || '';
  const canAccept = transaction.status === 'DEPOSIT_CONFIRMED' || transaction.status === 'MATCHED';
  const canUploadProof = transaction.status === 'SETTLEMENT_IN_PROGRESS';
  const isComplete = transaction.status === 'COMPLETED';
  const hasProof = transaction.status === 'SETTLEMENT_PROOF_UPLOADED' || isComplete;

  const handleAccept = useCallback(async () => {
    setLoading(true);
    try {
      await acceptTransaction({ transactionId: transaction.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastType('success');
      setToastMessage('Transaction accepted! You can now settle it.');
      setShowToast(true);
    } catch {
      setToastType('error');
      setToastMessage('Failed to accept transaction');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [transaction.id]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
        });
        setProofData(file.uri);
      }
    } catch {
      setToastType('error');
      setToastMessage('Failed to pick document');
      setShowToast(true);
    }
  }, []);

  const handleUploadProof = useCallback(async () => {
    if (!proofData.trim()) {
      setToastType('error');
      setToastMessage('Please select a file or enter proof data');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await uploadSettlementProof({
        transactionId: transaction.id,
        proofType: selectedProofType,
        proofData: proofData.trim(),
        notes: proofNotes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowProofSheet(false);
      setProofData('');
      setProofNotes('');
      setSelectedFile(null);
      setToastType('success');
      setToastMessage('Proof uploaded successfully!');
      setShowToast(true);
    } catch {
      setToastType('error');
      setToastMessage('Failed to upload proof');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [transaction.id, selectedProofType, proofData, proofNotes]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setProofData('');
  };

  const renderDetailRow = (label: string, value: string, highlight = false) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
    </View>
  );

  const isFileProofType = selectedProofType === 'receipt_image';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setShowToast(false)}
      />

      <ScreenHeader title={slug} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: status.bgColor }]}>
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>Send Amount</Text>
              <Text style={styles.amountValue}>
                {transaction.sendAmount} {transaction.sendCurrency}
              </Text>
            </View>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,245,0.4)" />
            </View>
            <View style={[styles.amountCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.amountLabel}>Receive Amount</Text>
              <Text style={styles.receiveValue}>
                {recvSymbol}
                {transaction.receiveAmount.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.amountMeta}>
            <Text style={styles.metaText}>
              Rate: 1 {transaction.sendCurrency} = {transaction.rate.toFixed(2)} {transaction.receiveCurrency}
            </Text>
            <Text style={styles.metaText}>Fee: {transaction.fee} {transaction.sendCurrency}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sender Details</Text>
          <View style={styles.partyCard}>
            <GradientAvatar initials="SN" size={44} fontSize={16} />
            <View style={styles.partyInfo}>
              <Text style={styles.partyName}>Sender #{transaction.payerId.slice(-6)}</Text>
              <Text style={styles.partyRole}>Payer</Text>
            </View>
            <View style={styles.partyBadge}>
              <Ionicons name="person-outline" size={12} color="#1A6FFF" />
              <Text style={styles.partyBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {transaction.processorId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processor Details</Text>
            <View style={styles.partyCard}>
              <GradientAvatar 
                initials={currentUser && transaction.processorId === currentUser.id 
                  ? getInitials(`${currentUser.firstName} ${currentUser.lastName}`)
                  : 'PR'
                } 
                size={44} 
                fontSize={16} 
              />
              <View style={styles.partyInfo}>
                <Text style={styles.partyName}>
                  {currentUser && transaction.processorId === currentUser.id 
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : `Processor #${transaction.processorId.slice(-6)}`
                  }
                </Text>
                <Text style={styles.partyRole}>Settlement Processor</Text>
              </View>
              {currentUser && transaction.processorId === currentUser.id && (
                <View style={[styles.partyBadge, { backgroundColor: 'rgba(0,229,160,0.1)' }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#00E5A0" />
                  <Text style={[styles.partyBadgeText, { color: '#00E5A0' }]}>You</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          <View style={styles.detailCard}>
            {renderDetailRow('Name', transaction.recipientName)}
            {transaction.recipientPhone && renderDetailRow('Phone', transaction.recipientPhone)}
            {renderDetailRow('Method', `${transaction.recipientAccountLabel} (${transaction.recipientAccountType.replace('_', ' ')})`)}
            {transaction.recipientWalletAddress && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Wallet</Text>
                <Text style={styles.walletAddr} numberOfLines={1} ellipsizeMode="middle">
                  {transaction.recipientWalletAddress}
                </Text>
              </View>
            )}
            {transaction.recipientNetwork && renderDetailRow('Network', transaction.recipientNetwork)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailCard}>
            {renderDetailRow('Corridor', transaction.corridorDisplay)}
            {renderDetailRow('Created', formatDateTime(transaction.createdAt))}
            {renderDetailRow('Updated', formatDateTime(transaction.updatedAt))}
            {transaction.completedAt && renderDetailRow('Completed', formatDateTime(transaction.completedAt), true)}
          </View>
        </View>

        {hasProof && transaction.settlementProofUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settlement Proof</Text>
            <View style={styles.proofCard}>
              <View style={styles.proofHeader}>
                <View style={styles.proofIconWrap}>
                  <Ionicons
                    name={
                      transaction.settlementProofType === 'receipt_image'
                        ? 'image'
                        : transaction.settlementProofType === 'transaction_hash'
                        ? 'link'
                        : 'document-text'
                    }
                    size={18}
                    color="#00E5A0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proofType}>
                    {transaction.settlementProofType?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={styles.proofData} numberOfLines={2} ellipsizeMode="middle">
                    {transaction.settlementProofUrl}
                  </Text>
                </View>
              </View>
              {transaction.settlementNotes && (
                <Text style={styles.proofNotes}>Note: {transaction.settlementNotes}</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomArea}>
        {canAccept && (
          <CTAButton
            title="Accept for Settlement"
            onPress={handleAccept}
            loading={loading}
          />
        )}
        {canUploadProof && (
          <CTAButton
            title="Upload Proof"
            onPress={() => setShowProofSheet(true)}
            loading={loading}
          />
        )}
        {transaction.status === 'SETTLEMENT_PROOF_UPLOADED' && (
          <CTAButton
            title="Awaiting Confirmation"
            onPress={() => {}}
            disabled
          />
        )}
        {isComplete && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#00E5A0" />
            <Text style={styles.completedText}>Settlement Complete</Text>
          </View>
        )}
      </View>

      <BottomSheet
        visible={showProofSheet}
        onClose={() => {
          setShowProofSheet(false);
          setSelectedFile(null);
          setProofData('');
          setProofNotes('');
        }}
        title="Upload Settlement Proof"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Proof Type</Text>
          <View style={styles.proofTypeRow}>
            {proofTypes.map((pt) => (
              <TouchableOpacity
                key={pt.type}
                style={[
                  styles.proofTypeChip,
                  selectedProofType === pt.type && styles.proofTypeChipActive,
                ]}
                onPress={() => {
                  setSelectedProofType(pt.type);
                  setSelectedFile(null);
                  setProofData('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pt.icon}
                  size={16}
                  color={selectedProofType === pt.type ? '#00E5A0' : 'rgba(255,255,245,0.5)'}
                />
                <Text
                  style={[
                    styles.proofTypeText,
                    selectedProofType === pt.type && styles.proofTypeTextActive,
                  ]}
                >
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isFileProofType ? (
            <View style={styles.filePickerSection}>
              <Text style={styles.sheetLabel}>Select File</Text>
              
              {selectedFile ? (
                <View style={styles.selectedFileCard}>
                  <View style={styles.selectedFileIcon}>
                    <Ionicons 
                      name={selectedFile.type.includes('pdf') ? 'document-text' : 'image'} 
                      size={24} 
                      color="#00E5A0" 
                    />
                  </View>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileType}>
                      {selectedFile.type.includes('pdf') ? 'PDF Document' : 'Image'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={clearSelectedFile}
                    style={styles.removeFileBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color="rgba(255,255,245,0.4)" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.filePickerBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <View style={styles.filePickerIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#00E5A0" />
                  </View>
                  <Text style={styles.filePickerTitle}>Tap to select file</Text>
                  <Text style={styles.filePickerSub}>Supports images and PDFs</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FormField
              label={
                selectedProofType === 'transaction_hash'
                  ? 'Transaction Hash'
                  : 'Reference Number'
              }
              placeholder={
                selectedProofType === 'transaction_hash'
                  ? '0x...'
                  : 'Enter reference number'
              }
              autoCapitalize="none"
              autoCorrect={false}
              value={proofData}
              onChangeText={setProofData}
            />
          )}

          <FormField
            label="Notes (Optional)"
            placeholder="Add any additional notes"
            value={proofNotes}
            onChangeText={setProofNotes}
            multiline
          />

          <View style={{ height: 16 }} />

          <CTAButton
            title="Submit Proof"
            onPress={handleUploadProof}
            loading={loading}
            disabled={!proofData.trim()}
          />

          <View style={{ height: 40 }} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111118' },
  scroll: { flex: 1 },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,245,0.5)',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  amountCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
    borderRadius: 16,
    padding: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountCol: {
    flex: 1,
  },
  arrowWrap: {
    paddingHorizontal: 12,
  },
  amountLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
    marginBottom: 4,
  },
  amountValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFF5',
  },
  receiveValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#00E5A0',
  },
  amountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,245,0.08)',
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.5)',
    marginBottom: 10,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
    marginBottom: 2,
  },
  partyRole: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,111,255,0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  partyBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#1A6FFF',
  },
  detailCard: {
    backgroundColor: '#222236',
    borderWidth: 1,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,245,0.06)',
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,245,0.5)',
  },
  detailValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FFFFF5',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailValueHighlight: {
    color: '#00E5A0',
  },
  walletAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#00E5A0',
    maxWidth: '55%',
  },
  proofCard: {
    backgroundColor: 'rgba(0,229,160,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
    borderRadius: 14,
    padding: 16,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proofIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,229,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFF5',
    marginBottom: 2,
  },
  proofData: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: 'rgba(255,255,245,0.6)',
  },
  proofNotes: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
    marginTop: 12,
    fontStyle: 'italic',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: '#111118',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,245,0.08)',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  completedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#00E5A0',
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  sheetLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,245,0.6)',
    marginBottom: 10,
  },
  proofTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  proofTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222236',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,245,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  proofTypeChipActive: {
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderColor: 'rgba(0,229,160,0.4)',
  },
  proofTypeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,245,0.5)',
  },
  proofTypeTextActive: {
    color: '#00E5A0',
  },
  filePickerSection: {
    marginBottom: 12,
  },
  filePickerBtn: {
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: 'rgba(0,229,160,0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,229,160,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  filePickerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
    marginBottom: 4,
  },
  filePickerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,229,160,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  selectedFileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,229,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFF5',
    marginBottom: 2,
  },
  selectedFileType: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,245,0.5)',
  },
  removeFileBtn: {
    padding: 4,
  },
});

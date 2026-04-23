import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenHeader, CTAButton, FormField, BottomSheet, Toast, Avatar, StatusBadge } from '../../components';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import { acceptTransaction, uploadSettlementProof, updateTransactionStatus } from '../../api/transactions';
import type { TransactionStatus, ProofType } from '../../types/transaction';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme/typography';

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

const proofTypes: { type: ProofType; label: string; icon: string }[] = [
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

function processorStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    PENDING_DEPOSIT: 'Pending Deposit',
    DEPOSIT_CONFIRMED: 'Ready for Settlement',
    MATCHED: 'Matched',
    SETTLEMENT_IN_PROGRESS: 'Settlement In Progress',
    SETTLEMENT_PROOF_UPLOADED: 'Proof Uploaded',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    EXPIRED: 'Expired',
    DISPUTED: 'Disputed',
  };
  return labels[status];
}

function processorStatusBadgeVariant(
  status: TransactionStatus
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
    case 'EXPIRED':
      return 'error';
    case 'PENDING_DEPOSIT':
    case 'SETTLEMENT_IN_PROGRESS':
    case 'DISPUTED':
      return 'warning';
    case 'DEPOSIT_CONFIRMED':
    case 'MATCHED':
    case 'SETTLEMENT_PROOF_UPLOADED':
      return 'info';
    default:
      return 'neutral';
  }
}

const hairline = palette.material.lightThin;
const surface = palette.grey[800];
const surfaceDeep = palette.grey[900];
const royalTint = 'rgba(158,121,210,0.15)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surfaceDeep },
  scroll: { flex: 1 },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    ...typography.bodySm,
    color: palette.grey[500],
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  heroAmount: {
    ...typography.valueLg,
    color: palette.grey[300],
    textAlign: 'center',
  },
  heroSendLine: {
    ...typography.subheader2,
    color: palette.grey[500],
    marginTop: 8,
  },
  heroBadgeWrap: {
    marginTop: 12,
  },
  amountCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: surface,
    ...borders.hairline.dark,
    borderRadius: radii.lg,
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
    ...typography.subheader2,
    color: palette.grey[500],
    marginBottom: 4,
  },
  amountValue: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    fontVariant: ['tabular-nums'],
  },
  receiveValue: {
    ...typography.bodySmMedium,
    color: palette.royal[400],
    fontVariant: ['tabular-nums'],
  },
  amountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    ...typography.subheader2,
    color: palette.grey[500],
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.label,
    color: palette.grey[500],
    marginBottom: 10,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: surface,
    ...borders.hairline.dark,
    borderRadius: radii.lg,
    padding: 14,
    gap: 12,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    marginBottom: 2,
  },
  partyRole: {
    ...typography.subheader2,
    color: palette.grey[500],
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: royalTint,
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  partyBadgeText: {
    ...typography.labelSm,
    color: palette.royal[400],
    textTransform: 'none',
    letterSpacing: 0,
  },
  detailCard: {
    backgroundColor: surface,
    ...borders.hairline.dark,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hairline,
  },
  detailLabel: {
    ...typography.bodySm,
    color: palette.grey[500],
  },
  detailValue: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailValueHighlight: {
    color: palette.royal[400],
  },
  walletAddr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: palette.royal[400],
    maxWidth: '55%',
  },
  proofCard: {
    backgroundColor: surface,
    ...borders.hairline.dark,
    borderRadius: radii.lg,
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
    borderRadius: radii.sm,
    backgroundColor: royalTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofType: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    marginBottom: 2,
  },
  proofData: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: palette.grey[500],
  },
  proofNotes: {
    ...typography.subheader2,
    color: palette.grey[500],
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
    backgroundColor: surfaceDeep,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hairline,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: royalTint,
    ...borders.hairline.dark,
    borderRadius: radii.md,
    paddingVertical: 16,
  },
  completedText: {
    ...typography.buttonS,
    color: palette.royal[400],
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  sheetLabel: {
    ...typography.label,
    color: palette.grey[500],
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
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: radii.sm,
    paddingVertical: 10,
  },
  proofTypeChipActive: {
    backgroundColor: royalTint,
    borderColor: palette.royal[500],
  },
  proofTypeText: {
    ...typography.labelSm,
    color: palette.grey[500],
    textTransform: 'none',
    letterSpacing: 0,
  },
  proofTypeTextActive: {
    color: palette.royal[400],
  },
  filePickerSection: {
    marginBottom: 12,
  },
  filePickerBtn: {
    backgroundColor: surfaceDeep,
    borderWidth: 2,
    borderColor: hairline,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: royalTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  filePickerTitle: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    marginBottom: 4,
  },
  filePickerSub: {
    ...typography.subheader2,
    color: palette.grey[500],
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: royalTint,
    ...borders.hairline.dark,
    borderRadius: radii.md,
    padding: 12,
    gap: 12,
  },
  selectedFileIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: royalTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    ...typography.bodySmMedium,
    color: palette.grey[300],
    marginBottom: 2,
  },
  selectedFileType: {
    ...typography.subheader2,
    color: palette.grey[500],
  },
  removeFileBtn: {
    padding: 4,
  },
});

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
          <Ionicons name="alert-circle-outline" size={48} color={palette.grey[600]} />
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  const recvSymbol = currencySymbols[transaction.receiveCurrency] || '';
  const isMyTransaction = transaction.processorId === currentUser?.id;
  const canAccept = transaction.status === 'DEPOSIT_CONFIRMED' && !transaction.processorId;
  const canUploadProof = transaction.status === 'SETTLEMENT_IN_PROGRESS' && isMyTransaction;
  const canConfirmSettlement = transaction.status === 'SETTLEMENT_PROOF_UPLOADED' && isMyTransaction;
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

  const handleConfirmSettlement = useCallback(async () => {
    setLoading(true);
    try {
      await updateTransactionStatus(transaction.id, 'COMPLETED');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastType('success');
      setToastMessage('Settlement confirmed! Transaction completed.');
      setShowToast(true);
    } catch {
      setToastType('error');
      setToastMessage('Failed to confirm settlement');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [transaction.id]);

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
        <View style={styles.hero}>
          <Text style={styles.heroAmount}>
            {recvSymbol}
            {transaction.receiveAmount.toLocaleString()} {transaction.receiveCurrency}
          </Text>
          <Text style={styles.heroSendLine}>
            {transaction.sendAmount} {transaction.sendCurrency}
          </Text>
          <View style={styles.heroBadgeWrap}>
            <StatusBadge
              label={processorStatusLabel(transaction.status)}
              variant={processorStatusBadgeVariant(transaction.status)}
            />
          </View>
        </View>

        <View style={styles.amountCard}>
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
            <Avatar seed={`Sender ${transaction.payerId.slice(-6)}`} size={44} />
            <View style={styles.partyInfo}>
              <Text style={styles.partyName}>Sender #{transaction.payerId.slice(-6)}</Text>
              <Text style={styles.partyRole}>Payer</Text>
            </View>
            <View style={styles.partyBadge}>
              <Ionicons name="person-outline" size={12} color={palette.royal[400]} />
              <Text style={styles.partyBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {transaction.processorId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processor Details</Text>
            <View style={styles.partyCard}>
              <Avatar 
                seed={currentUser && transaction.processorId === currentUser.id 
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : `Processor ${transaction.processorId.slice(-6)}`
                } 
                size={44} 
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
                <View style={styles.partyBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={palette.royal[400]} />
                  <Text style={styles.partyBadgeText}>You</Text>
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
                    color={palette.royal[400]}
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
        {canConfirmSettlement && (
          <CTAButton
            title="Confirm Settlement"
            onPress={handleConfirmSettlement}
            loading={loading}
          />
        )}
        {isComplete && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={palette.royal[400]} />
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
                  color={selectedProofType === pt.type ? palette.royal[400] : palette.grey[500]}
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
                      color={palette.royal[400]}
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
                    <Ionicons name="close-circle" size={24} color={palette.grey[600]} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.filePickerBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <View style={styles.filePickerIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={28} color={palette.royal[400]} />
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

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../../components/Icon';
import { ScreenHeader, CTAButton, StatusBadge, BottomSheet } from '../../components';
import { useTransaction } from '../../hooks/useTransactions';
import { useAcceptOrder } from '../../hooks/useMpQueue';
import { useUploadProof } from '../../hooks/useMyOrders';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../api/errors';
import { isApiError } from '../../api/client';
import { pickProofFile, type PickedFile } from '../../api/uploads';
import { toStatusGroup, isTerminalStatus } from '../../utils/transactionStatus';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProcessorStackParamList } from '../../navigation/AppNavigator';
import { palette } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { borders } from '../../theme/elevation';
import { typography } from '../../theme';

const DESCRIPTION_MAX_LENGTH = 280;

type Props = NativeStackScreenProps<ProcessorStackParamList, 'OrderDetail'>;

export const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId, orderId, isQueueItem, queuePreview } = route.params;
  const { data: tx, error: txError, isError: isTxError } = useTransaction(transactionId, {
    enabled: !isQueueItem,
  });
  const acceptOrder = useAcceptOrder();
  const uploadProof = useUploadProof();
  const toast = useToast();

  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [description, setDescription] = useState('');
  const [confirmSheetVisible, setConfirmSheetVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const status = tx?.status ?? 'QUEUED';
  const group = toStatusGroup(status);
  const terminal = isTerminalStatus(status);

  const hasExistingProof = !!tx?.proof?.proofUrl;
  const showProofSection = !isQueueItem && !terminal && status !== 'QUEUED';
  const showProofPreview = !isQueueItem && hasExistingProof;

  const handleAccept = useCallback(async () => {
    try {
      await acceptOrder.mutateAsync(transactionId);
      toast.success('Order accepted! Check the Active tab.');
      navigation.goBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [transactionId, acceptOrder, toast, navigation]);

  const handlePickFile = useCallback(async () => {
    const result = await pickProofFile();
    if (result.ok) {
      setPickedFile(result.file);
    } else if (result.error.type !== 'cancelled') {
      toast.error(result.error.message);
    }
  }, [toast]);

  const handleRemoveFile = useCallback(() => {
    setPickedFile(null);
  }, []);

  const handleSubmitProof = useCallback(async () => {
    if (!pickedFile || !orderId) return;

    setConfirmSheetVisible(false);
    setUploading(true);

    try {
      await uploadProof.mutateAsync({
        orderId,
        transactionId,
        data: {
          file: {
            uri: pickedFile.uri,
            name: pickedFile.name,
            mimeType: pickedFile.mimeType,
          },
          description: description.trim() || undefined,
        },
      });

      toast.success('Proof uploaded successfully.');
      setPickedFile(null);
      setDescription('');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }, [pickedFile, description, orderId, uploadProof, toast]);

  if (isQueueItem && queuePreview) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
        <ScreenHeader title="Order Detail" onBack={() => navigation.goBack()} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusRow}>
            <StatusBadge label="QUEUED" variant="warning" />
          </View>

          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <View style={styles.amountRow}>
              <View style={styles.amountCol}>
                <Text style={[styles.amountLabel, { color: palette.grey[500] }]}>From</Text>
                <Text style={[styles.amountValue, { color: palette.grey[900] }]}>
                  {queuePreview.originalAmount?.toLocaleString()} {queuePreview.fromCurrency}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={palette.grey[500]} />
              <View style={[styles.amountCol, { alignItems: 'flex-end' }]}>
                <Text style={[styles.amountLabel, { color: palette.grey[500] }]}>To</Text>
                <Text style={[styles.amountValue, { color: palette.grey[900] }]}>
                  {queuePreview.convertedAmount?.toLocaleString()} {queuePreview.toCurrency}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: palette.material.darkThin }]} />

            <View style={styles.detailRows}>
              {queuePreview.fxRate != null && (
                <DetailRow label="Rate" value={`1 ${queuePreview.fromCurrency} = ${queuePreview.fxRate.toLocaleString()} ${queuePreview.toCurrency}`} />
              )}
              <DetailRow label="Code" value={queuePreview.transactionCode} />
              <DetailRow
                label="Created"
                value={new Date(queuePreview.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              />
            </View>
          </View>

          <View style={styles.ctaWrap}>
            <CTAButton
              title="Accept Order"
              onPress={handleAccept}
              loading={acceptOrder.isPending}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isTxError) {
    const is403 = isApiError(txError) && txError.status === 403;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
        <ScreenHeader title="Order Detail" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={palette.grey[500]} />
          <Text style={[styles.errorTitle, { color: palette.grey[900] }]}>
            {is403 ? 'Access Denied' : 'Something went wrong'}
          </Text>
          <Text style={[styles.errorSubtext, { color: palette.grey[500] }]}>
            {is403
              ? 'You don\u2019t have permission to view this transaction.'
              : getApiErrorMessage(txError)}
          </Text>
          <CTAButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            ghost
            style={{ marginTop: 20, width: 160 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
        <ScreenHeader title="Order Detail" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={palette.royal[500]} />
          <Text style={[styles.loadingText, { color: palette.grey[500] }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isImageProof = pickedFile?.mimeType.startsWith('image/');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.grey[100] }]} edges={['top']}>
      <ScreenHeader title="Order Detail" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          <StatusBadge
            label={status}
            variant={group === 'COMPLETED' ? 'success' : group === 'FAILED' ? 'error' : 'warning'}
          />
        </View>

        {/* Amount card */}
        <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
          <View style={styles.amountRow}>
            <View style={styles.amountCol}>
              <Text style={[styles.amountLabel, { color: palette.grey[500] }]}>From</Text>
              <Text style={[styles.amountValue, { color: palette.grey[900] }]}>
                {tx.originalAmount?.toLocaleString()} {tx.fromCurrency}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={palette.grey[500]} />
            <View style={[styles.amountCol, { alignItems: 'flex-end' }]}>
              <Text style={[styles.amountLabel, { color: palette.grey[500] }]}>To</Text>
              <Text style={[styles.amountValue, { color: palette.grey[900] }]}>
                {tx.convertedAmount?.toLocaleString()} {tx.toCurrency}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.material.darkThin }]} />

          <View style={styles.detailRows}>
            <DetailRow label="Rate" value={`1 ${tx.fromCurrency} = ${tx.fxRate?.toLocaleString()} ${tx.toCurrency}`} />
            {tx.chargeAmount > 0 && (
              <DetailRow label="Fee" value={`${tx.chargeAmount} ${tx.fromCurrency}`} />
            )}
            <DetailRow label="Code" value={tx.transactionCode} />
            <DetailRow
              label="Created"
              value={new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            />
          </View>
        </View>

        {/* Recipient details */}
        <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={16} color={palette.royal[500]} />
            <Text style={[styles.cardHeaderText, { color: palette.grey[900] }]}>Recipient</Text>
          </View>
          {tx.recipient?.accountName && (
            <DetailRow label="Account name" value={tx.recipient.accountName} />
          )}
          {tx.recipient?.accountNumber && (
            <DetailRow label="Account number" value={tx.recipient.accountNumber} />
          )}
          {tx.recipient?.bankCode && (
            <DetailRow label="Bank code" value={tx.recipient.bankCode} />
          )}
          {tx.recipient?.walletAddress && (
            <DetailRow label="Wallet" value={tx.recipient.walletAddress} mono />
          )}
        </View>

        {/* Payer confirmation status */}
        {!isQueueItem && (
          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-done-outline" size={16} color={palette.royal[500]} />
              <Text style={[styles.cardHeaderText, { color: palette.grey[900] }]}>Payer Status</Text>
            </View>
            <DetailRow
              label="Payer confirmed"
              value={status === 'PAYER_PAID' || status === 'COMPLETE' ? 'Yes' : 'Not yet'}
            />
          </View>
        )}

        {/* Existing proof preview */}
        {showProofPreview && (
          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={16} color={palette.status.positive} />
              <Text style={[styles.cardHeaderText, { color: palette.grey[900] }]}>Proof Submitted</Text>
            </View>
            {tx.proof?.description && (
              <Text style={[styles.proofDescription, { color: palette.grey[400] }]}>
                {tx.proof.description}
              </Text>
            )}
            <DetailRow label="Type" value={tx.proof?.contentType ?? 'Unknown'} />
            {tx.proof?.uploadedAt && (
              <DetailRow
                label="Uploaded"
                value={new Date(tx.proof.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              />
            )}
          </View>
        )}

        {/* Proof upload section */}
        {showProofSection && !hasExistingProof && (
          <View style={[styles.card, { backgroundColor: palette.grey[200] }, borders.hairline.light, { borderRadius: radii.lg }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach-outline" size={16} color={palette.royal[500]} />
              <Text style={[styles.cardHeaderText, { color: palette.grey[900] }]}>Proof of Payment</Text>
            </View>

            {!pickedFile ? (
              <Pressable
                style={[styles.uploadArea, { borderColor: palette.grey[600] }]}
                onPress={handlePickFile}
                accessibilityLabel="Select proof file"
                accessibilityRole="button"
              >
                <Ionicons name="cloud-upload-outline" size={28} color={palette.royal[400]} />
                <Text style={[styles.uploadTitle, { color: palette.grey[900] }]}>
                  Tap to select proof
                </Text>
                <Text style={[styles.uploadHint, { color: palette.grey[500] }]}>
                  Image or PDF, max 10 MB
                </Text>
              </Pressable>
            ) : (
              <View>
                <View style={[styles.filePreview, { backgroundColor: palette.grey[200] }]}>
                  {isImageProof && (
                    <Image
                      source={{ uri: pickedFile.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.fileInfo}>
                    <Ionicons
                      name={isImageProof ? 'image-outline' : 'document-outline'}
                      size={18}
                      color={palette.royal[400]}
                    />
                    <View style={styles.fileInfoText}>
                      <Text
                        style={[styles.fileName, { color: palette.grey[900] }]}
                        numberOfLines={1}
                      >
                        {pickedFile.name}
                      </Text>
                      <Text style={[styles.fileSize, { color: palette.grey[500] }]}>
                        {(pickedFile.size / 1024).toFixed(0)} KB
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleRemoveFile}
                      hitSlop={12}
                      accessibilityLabel="Remove selected file"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle" size={22} color={palette.grey[500]} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.descriptionWrap}>
                  <Text style={[styles.descriptionLabel, { color: palette.grey[400] }]}>
                    Description (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.descriptionInput,
                      { color: palette.grey[900], borderColor: palette.grey[600], backgroundColor: palette.grey[100] },
                    ]}
                    value={description}
                    onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX_LENGTH))}
                    placeholder="e.g. Bank transfer receipt"
                    placeholderTextColor={palette.grey[600]}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    multiline
                    numberOfLines={2}
                  />
                  <Text style={[styles.charCount, { color: palette.grey[600] }]}>
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </Text>
                </View>

                <CTAButton
                  title={uploading ? 'Uploading…' : 'Submit Proof'}
                  onPress={() => setConfirmSheetVisible(true)}
                  loading={uploading}
                  disabled={uploading}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.ctaWrap}>
          {isQueueItem && (
            <CTAButton
              title="Accept Order"
              onPress={handleAccept}
              loading={acceptOrder.isPending}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirmation bottom sheet */}
      <BottomSheet
        visible={confirmSheetVisible}
        onClose={() => setConfirmSheetVisible(false)}
        title="Confirm Proof Upload"
      >
        <View style={styles.sheetBody}>
          <Text style={[styles.sheetText, { color: palette.grey[900] }]}>
            You are about to submit proof of payment for this order.
            Please ensure the file accurately reflects the completed payout.
            Submitting false proof may result in account suspension.
          </Text>

          {pickedFile && (
            <View style={[styles.sheetFileRow, { backgroundColor: palette.grey[200] }]}>
              <Ionicons
                name={isImageProof ? 'image-outline' : 'document-outline'}
                size={16}
                color={palette.royal[400]}
              />
              <Text
                style={[styles.sheetFileName, { color: palette.grey[900] }]}
                numberOfLines={1}
              >
                {pickedFile.name}
              </Text>
            </View>
          )}

          <CTAButton
            title="Submit Proof"
            onPress={handleSubmitProof}
            loading={uploading}
            style={{ marginTop: 16 }}
          />
          <CTAButton
            title="Cancel"
            onPress={() => setConfirmSheetVisible(false)}
            ghost
            style={{ marginTop: 8 }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: palette.grey[500] }]}>{label}</Text>
      <Text
        style={[
          mono ? styles.detailMono : styles.detailValue,
          { color: palette.grey[900] },
        ]}
        selectable={mono}
        numberOfLines={mono ? 2 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  loadingText: { ...typography.bodySm },
  errorTitle: { ...typography.h4, marginTop: 4 },
  errorSubtext: { ...typography.bodySm, textAlign: 'center', lineHeight: 20 },
  statusRow: { alignItems: 'center', marginBottom: 16 },
  card: { padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderText: { ...typography.h4 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  amountCol: { flex: 1 },
  amountLabel: { ...typography.label, marginBottom: 4 },
  amountValue: { fontFamily: 'Inter_700Bold', fontSize: 18, fontVariant: ['tabular-nums'] },
  divider: { height: 1, marginBottom: 12 },
  detailRows: { gap: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  detailLabel: { ...typography.subheader2, flex: 0.4 },
  detailValue: { ...typography.main14, flex: 0.6, textAlign: 'right' },
  detailMono: { ...typography.monoSm, flex: 0.6, textAlign: 'right', lineHeight: 18 },
  proofDescription: { ...typography.bodySm, marginBottom: 10 },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 6,
  },
  uploadTitle: { ...typography.main14, marginTop: 4 },
  uploadHint: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  filePreview: { borderRadius: 10, overflow: 'hidden' },
  previewImage: { width: '100%', height: 160 },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  fileInfoText: { flex: 1 },
  fileName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  fileSize: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  descriptionWrap: { marginTop: 14 },
  descriptionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 6 },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'right', marginTop: 4 },
  ctaWrap: { marginTop: 8 },
  sheetBody: { paddingHorizontal: 4, paddingBottom: 8 },
  sheetText: { ...typography.bodySm, lineHeight: 20, marginBottom: 14 },
  sheetFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sheetFileName: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
});

/**
 * Proof-upload file picker.
 *
 * The MP picks a proof file here; the raw file is then sent directly to
 * `POST /v1/mp/orders/{orderId}/proof` as multipart/form-data (see
 * `src/api/mpOrders.ts#uploadProof`). The backend hosts the file itself and
 * returns a server-hosted `proofUrl`, which the payer reads back on the
 * transaction's `proof` record. No client-side file hosting is required.
 */

import * as DocumentPicker from 'expo-document-picker';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_MIME_EXACT = ['application/pdf'];

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface FileValidationError {
  type: 'size' | 'mime' | 'cancelled';
  message: string;
}

export type PickResult =
  | { ok: true; file: PickedFile }
  | { ok: false; error: FileValidationError };

function isAllowedMime(mime: string): boolean {
  if (ALLOWED_MIME_EXACT.includes(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

export async function pickProofFile(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...ALLOWED_MIME_EXACT, 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return {
      ok: false,
      error: { type: 'cancelled', message: 'File selection cancelled.' },
    };
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'application/octet-stream';

  if (!isAllowedMime(mimeType)) {
    return {
      ok: false,
      error: {
        type: 'mime',
        message: `Unsupported file type (${mimeType}). Please choose an image or PDF.`,
      },
    };
  }

  const size = asset.size ?? 0;
  if (size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: {
        type: 'size',
        message: `File is too large (${sizeMb} MB). Maximum size is 10 MB.`,
      },
    };
  }

  return {
    ok: true,
    file: {
      uri: asset.uri,
      name: asset.name ?? 'proof',
      mimeType,
      size,
    },
  };
}

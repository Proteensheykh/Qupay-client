/**
 * Proof-upload pipeline.
 *
 * PENDING BACKEND DEPENDENCY (Dep #1):
 * The backend does not yet expose a presigned-URL or direct file-upload endpoint.
 * `POST /v1/mp/orders/{orderId}/proof` accepts only a `{ proofUrl }` JSON body,
 * meaning the file must be hosted elsewhere before the URL is submitted.
 *
 * Current behaviour (pass-through):
 *   `uploadFile()` is a **no-op placeholder** that returns the local file URI
 *   unchanged. Once a real upload target is available, replace its implementation
 *   with one of:
 *
 *   Option A (preferred): Backend ships a presigned-upload endpoint.
 *     1. `GET /v1/uploads/presigned?contentType=...` → returns `{ uploadUrl, publicUrl }`.
 *     2. `PUT <uploadUrl>` with the raw file bytes.
 *     3. Return `publicUrl` to the caller.
 *
 *   Option B (Cloudinary fallback):
 *     1. Add `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` and `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to env.
 *     2. POST to `https://api.cloudinary.com/v1_1/<cloud>/auto/upload` with a
 *        FormData body containing the file + upload preset.
 *     3. Return `secure_url` from the response.
 *
 * When either option is implemented, remove the pass-through and update the
 * integration-plan.md Phase 5 section accordingly.
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

/**
 * Upload the file to a remote host and return its public URL.
 *
 * TODO (Dep #1): Replace this pass-through with a real upload once the backend
 * ships a presigned-URL endpoint or we commit to the Cloudinary fallback.
 * Currently returns the local URI so the rest of the pipeline can be exercised,
 * but `POST /v1/mp/orders/{orderId}/proof` will likely reject it since the
 * backend expects a remotely-accessible URL.
 */
export async function uploadFile(file: PickedFile): Promise<string> {
  // --- PLACEHOLDER: pass-through returning the local URI ---
  // When a real upload target is available, implement the upload here
  // and return the remotely-accessible URL instead.
  return file.uri;
}

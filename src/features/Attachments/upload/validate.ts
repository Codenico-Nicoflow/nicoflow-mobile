import {
  ATTACHMENT_MAX_BYTES,
  type AttachmentValidationError,
  isAllowedAttachmentMime,
  isAllowedAttachmentSize,
} from '@nicoflow/shared/types';

// A file chosen from the camera, photo library or document picker, normalised to
// the fields the upload flow needs. RN has no DOM `File`, which is why shared's
// `validateAttachmentFile(file: File)` can't be used here — but the two
// primitives it is built from take plain values, so the allowlist and the cap
// are still shared rather than duplicated.
export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export { ATTACHMENT_MAX_BYTES };

// Mirrors shared's validateAttachmentFile exactly, including the order: empty is
// reported before size so a 0-byte file reads as EMPTY_FILE, not SIZE_EXCEEDED.
export const validatePickedFile = (file: PickedFile): AttachmentValidationError | null => {
  if (!isAllowedAttachmentMime(file.mimeType)) return 'MIME_NOT_ALLOWED';
  if (file.size <= 0) return 'EMPTY_FILE';
  if (!isAllowedAttachmentSize(file.size)) return 'SIZE_EXCEEDED';
  return null;
};

// The i18n key for each failure, so callers toast the same copy web does.
export const VALIDATION_COPY_KEY: Record<AttachmentValidationError, string> = {
  MIME_NOT_ALLOWED: 'attachments.invalidType',
  EMPTY_FILE: 'attachments.emptyFile',
  SIZE_EXCEEDED: 'attachments.tooLarge',
};

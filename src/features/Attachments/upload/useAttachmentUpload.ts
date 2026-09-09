import { useCallback, useState } from 'react';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/toast';
import { useConfirmAttachmentMutation, useGetUploadUrlMutation } from '@/lib/store';
import { getApiErrorCode, resolveApiErrorMessage } from '@/lib/utils/apiError';

import { uploadToStorage } from './uploadToStorage';
import { type PickedFile, validatePickedFile, VALIDATION_COPY_KEY } from './validate';

// The two §4 refusals the confirm step can return, and the copy each maps to.
// Both are informational on mobile — a reader app never offers a purchase.
const QUOTA_COPY_KEY: Record<string, string> = {
  PLAN_LIMIT_EXCEEDED: 'attachments.proHintReader',
  STORAGE_LIMIT_EXCEEDED: 'attachments.storageFull',
};

const isQuotaError = (code: string | undefined): boolean => code !== undefined && code in QUOTA_COPY_KEY;

// SPEC §5: at most 20 attachments per owner. The backend is the authority
// (PLAN_LIMIT_EXCEEDED), this pre-empts the obvious case so a user does not pick
// a file, wait for an upload, and only then be told no.
export const MAX_ATTACHMENTS_PER_OWNER = 20;

// One in-flight upload. `id` is a client-only key — the server id exists only
// after confirm, at which point the item leaves this list and the row reappears
// through the invalidated attachments query.
export interface UploadItem {
  id: string;
  name: string;
  status: 'uploading' | 'error';
  /** 0..1, drives the determinate bar. */
  progress: number;
  /** The §4 code when the confirm step refused it — drives the quota message. */
  errorCode?: string;
  /** Retained so a failed upload can be retried without re-picking the file. */
  file: PickedFile;
}

let uploadKey = 0;

interface UseAttachmentUpload {
  uploads: UploadItem[];
  upload: (file: PickedFile) => Promise<void>;
  /** Re-runs a failed upload from its retained file. */
  retry: (id: string) => Promise<void>;
  /** Drops a failed upload from the list without retrying. */
  remove: (id: string) => void;
  isAtCap: boolean;
}

export const useAttachmentUpload = (
  ownerType: AttachmentOwnerType,
  ownerId: string,
  currentCount: number
): UseAttachmentUpload => {
  const { t } = useTranslation('task');
  const [getUploadUrl] = useGetUploadUrlMutation();
  const [confirmAttachment] = useConfirmAttachmentMutation();
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const isAtCap = currentCount + uploads.length >= MAX_ATTACHMENTS_PER_OWNER;

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => (u.id === id ? { ...u, ...changes } : u)));
  }, []);

  // The three-step flow — upload-url, PUT, confirm — shared by a first attempt
  // and a retry.
  const run = useCallback(
    async (id: string, file: PickedFile) => {
      patch(id, { status: 'uploading', progress: 0, errorCode: undefined });

      try {
        const { url, headers, s3Key } = await getUploadUrl({
          ownerType,
          ownerId,
          fileName: file.name,
          mimeType: file.mimeType,
          fileSize: file.size,
        }).unwrap();

        await uploadToStorage(file, url, headers, ratio => patch(id, { progress: ratio }));
        await confirmAttachment({ s3Key, fileName: file.name }).unwrap();

        // Confirmed: drop the in-flight item; the real row arrives via the
        // invalidated list query.
        setUploads(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        const code = getApiErrorCode(error);
        patch(id, { status: 'error', errorCode: code });
        // A quota refusal gets the reader-app message; anything else gets the
        // ordinary error. Neither carries a purchase CTA (E-037).
        toast.error(isQuotaError(code) ? t(QUOTA_COPY_KEY[code as string]) : resolveApiErrorMessage(error));
      }
    },
    [confirmAttachment, getUploadUrl, ownerId, ownerType, patch, t]
  );

  const upload = useCallback(
    async (file: PickedFile) => {
      if (currentCount + uploads.length >= MAX_ATTACHMENTS_PER_OWNER) {
        toast.error(t('attachments.countCap'));
        return;
      }

      // Fail fast on type/size before spending a round trip. The backend
      // re-validates from the stored object at confirm — that HeadObject check,
      // not this one, is the real enforcement boundary.
      const invalid = validatePickedFile(file);
      if (invalid) {
        toast.error(t(VALIDATION_COPY_KEY[invalid], { name: file.name }));
        return;
      }

      const id = `upload-${++uploadKey}`;
      setUploads(prev => [...prev, { id, name: file.name, status: 'uploading', progress: 0, file }]);
      await run(id, file);
    },
    [currentCount, run, t, uploads.length]
  );

  const retry = useCallback(
    async (id: string) => {
      const item = uploads.find(u => u.id === id);
      if (item) await run(id, item.file);
    },
    [run, uploads]
  );

  const remove = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  return { uploads, upload, retry, remove, isAtCap };
};

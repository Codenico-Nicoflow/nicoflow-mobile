import { useCallback, useState } from 'react';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/toast';
import { useConfirmAttachmentMutation, useGetUploadUrlMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

import { uploadToStorage } from './uploadToStorage';
import { type PickedFile, validatePickedFile, VALIDATION_COPY_KEY } from './validate';

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
}

let uploadKey = 0;

interface UseAttachmentUpload {
  uploads: UploadItem[];
  upload: (file: PickedFile) => Promise<void>;
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
      setUploads(prev => [...prev, { id, name: file.name, status: 'uploading' }]);

      try {
        const { url, headers, s3Key } = await getUploadUrl({
          ownerType,
          ownerId,
          fileName: file.name,
          mimeType: file.mimeType,
          fileSize: file.size,
        }).unwrap();

        await uploadToStorage(file, url, headers);
        await confirmAttachment({ s3Key, fileName: file.name }).unwrap();

        // Confirmed: drop the in-flight item; the real row arrives via the
        // invalidated list query.
        setUploads(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        setUploads(prev => prev.map(u => (u.id === id ? { ...u, status: 'error' } : u)));
        toast.error(resolveApiErrorMessage(error));
      }
    },
    [confirmAttachment, currentCount, getUploadUrl, ownerId, ownerType, t, uploads.length]
  );

  return { uploads, upload, isAtCap };
};

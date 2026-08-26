import { forwardRef, useImperativeHandle, useRef } from 'react';

import type { IBucket } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogRef,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { useDeleteBucketMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/toast';

interface BucketDeleteAlertProps {
  bucket: IBucket | null;
}

// Mirrors web's BucketDeleteDialog (nicoflow-frontend/src/features/Bucket/components/BucketDeleteDialog).
//
// No Sheet-level onDismiss prop, on purpose — matching NoteEditorPage's
// working delete-confirm pattern. The sheet's own onDismiss and an
// imperative .dismiss() call both fire the same close animation; wiring
// onDismiss AND calling .dismiss() from Cancel/success double-fires it,
// which leaves the underlying BottomSheetModal's present() a no-op the next
// time it's opened. Cancel/success only ever call .dismiss() themselves.
export const BucketDeleteAlert = forwardRef<AlertDialogRef, BucketDeleteAlertProps>(function BucketDeleteAlert(
  { bucket },
  ref
) {
  const { t } = useTranslation(['bucket', 'common']);
  const [deleteBucket, { isLoading }] = useDeleteBucketMutation();
  const alertRef = useRef<AlertDialogRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => alertRef.current?.present(),
    dismiss: () => alertRef.current?.dismiss(),
  }));

  const handleDelete = async () => {
    if (!bucket) return;
    try {
      await deleteBucket(bucket.id).unwrap();
      showSuccessToast(ToastMessages.BUCKET_DELETED, toast);
      alertRef.current?.dismiss();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <AlertDialog ref={alertRef}>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
        <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction onPress={() => void handleDelete()}>
          {isLoading ? `${t('deleteDialog.confirmLabel')}...` : t('deleteDialog.confirmLabel')}
        </AlertDialogAction>
        <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>{t('common:actions.cancel')}</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialog>
  );
});

import { forwardRef, useImperativeHandle, useRef } from 'react';

import type { INotification } from '@nicoflow/shared/types';
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
import { useDeleteNotificationMutation } from '@/lib/store';
import { showErrorToast } from '@/lib/toast';

interface NotificationDeleteAlertProps {
  notification: INotification | null;
}

// Swiping a row open only *offers* the delete — nothing is destroyed until it is
// confirmed here. Follows BucketDeleteAlert, including its no-onDismiss-prop
// rule: the sheet's own onDismiss plus an imperative .dismiss() double-fire the
// close animation and leave the next present() a no-op.
export const NotificationDeleteAlert = forwardRef<AlertDialogRef, NotificationDeleteAlertProps>(
  function NotificationDeleteAlert({ notification }, ref) {
    const { t } = useTranslation(['notification', 'common']);
    const [deleteNotification, { isLoading }] = useDeleteNotificationMutation();
    const alertRef = useRef<AlertDialogRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => alertRef.current?.present(),
      dismiss: () => alertRef.current?.dismiss(),
    }));

    const handleDelete = async () => {
      if (!notification) return;
      try {
        await deleteNotification(notification.id).unwrap();
        toast.success(t('notification:toast.dismissed'));
        alertRef.current?.dismiss();
      } catch (error) {
        showErrorToast(error, toast);
      }
    };

    return (
      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('notification:panel.dismiss')}</AlertDialogTitle>
          <AlertDialogDescription>{notification?.title ?? ''}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => void handleDelete()}>
            {isLoading ? `${t('common:actions.delete')}...` : t('common:actions.delete')}
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    );
  }
);

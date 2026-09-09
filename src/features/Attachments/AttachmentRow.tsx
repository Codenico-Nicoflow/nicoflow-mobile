import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import type { IAttachment } from '@nicoflow/shared/types';
import { formatBytes } from '@nicoflow/shared/utils';
import { Download, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/toast';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeleteAttachmentMutation, useGetDownloadUrlMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

import { iconForMime } from './attachmentIcon';

interface AttachmentRowProps {
  attachment: IAttachment;
}

// One confirmed attachment: type icon, name, size, and two actions.
//
// Delete is an honest hard delete with no undo (the S3 object goes too), so the
// confirm is an inline "Delete? [Cancel] [Delete]" swap on the row rather than a
// modal — same call web made. This is the deliberate exception to the app's
// swipe-opens-a-modal rule: there is no destructive swipe here to intercept.
export function AttachmentRow({ attachment }: AttachmentRowProps) {
  const { t } = useTranslation('task');
  const colors = useTheme();
  const [getDownloadUrl, { isLoading: isDownloading }] = useGetDownloadUrlMutation();
  const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation();
  const [confirming, setConfirming] = useState(false);

  const Icon = iconForMime(attachment.mimeType);

  const handleDownload = async () => {
    try {
      const { url } = await getDownloadUrl(attachment.id).unwrap();
      await Linking.openURL(url);
    } catch (error) {
      toast.error(resolveApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment({ id: attachment.id, ownerId: attachment.ownerId }).unwrap();
      toast.success(t('attachments.deleteSuccess', { name: attachment.fileName }));
      // The row leaves via the invalidated list query — no local removal needed.
    } catch (error) {
      toast.error(resolveApiErrorMessage(error));
      setConfirming(false); // keep the row so the user can retry
    }
  };

  return (
    <View
      testID={`attachment-row-${attachment.id}`}
      className="flex-row items-center gap-2 border border-border dark:border-border-dark px-2 py-1.5"
      style={{ borderRadius: Radius.md }}
    >
      <Icon size={16} color={colors.textSecondary} />
      <Text className="min-w-0 flex-1 text-sm text-foreground dark:text-foreground-dark" numberOfLines={1}>
        {attachment.fileName}
      </Text>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        {formatBytes(attachment.fileSize)}
      </Text>

      {confirming ? (
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('attachments.deleteConfirm')}
          </Text>
          <Pressable
            onPress={() => setConfirming(false)}
            disabled={isDeleting}
            accessibilityRole="button"
            testID={`attachment-delete-cancel-${attachment.id}`}
            className="px-2 py-1"
          >
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
              {t('attachments.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleDelete()}
            disabled={isDeleting}
            accessibilityRole="button"
            testID={`attachment-delete-confirm-${attachment.id}`}
            className="bg-destructive px-2 py-1"
            style={{ borderRadius: Radius.sm }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-xs font-medium text-white">{t('attachments.deleteAction')}</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => void handleDownload()}
            disabled={isDownloading}
            accessibilityRole="button"
            accessibilityLabel={t('attachments.download', { name: attachment.fileName })}
            testID={`attachment-download-${attachment.id}`}
            className="p-1"
          >
            {isDownloading ? <ActivityIndicator size="small" /> : <Download size={16} color={colors.textSecondary} />}
          </Pressable>
          <Pressable
            onPress={() => setConfirming(true)}
            accessibilityRole="button"
            accessibilityLabel={t('attachments.delete', { name: attachment.fileName })}
            testID={`attachment-delete-${attachment.id}`}
            className="p-1"
          >
            <Trash2 size={16} color={colors.textSecondary} />
          </Pressable>
        </>
      )}
    </View>
  );
}

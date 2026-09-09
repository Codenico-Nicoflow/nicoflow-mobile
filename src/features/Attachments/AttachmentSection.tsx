import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { Paperclip } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { useGetAttachmentsQuery } from '@/lib/store';

import { UploadControl } from './upload/UploadControl';
import { AttachmentRow } from './AttachmentRow';

// Matches web's SKELETON_ROWS — never a blank gap or a spinner-only state.
const SKELETON_ROWS = 3;

interface AttachmentSectionProps {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  /** Upload affordance, supplied by the host screen (NIC-1995). */
  children?: ReactNode;
}

// Owner-parameterised attachment list, hosted on task/project/note detail
// screens. Reads are open on any plan — a free or downgraded user still sees and
// downloads existing files; only writes are Pro-gated, server-side.
export function AttachmentSection({ ownerType, ownerId, children }: AttachmentSectionProps) {
  const { t } = useTranslation('task');
  const colors = useTheme();
  const { data: attachments = [], isLoading } = useGetAttachmentsQuery({ ownerType, ownerId });

  return (
    <View className="gap-2" testID="attachment-section">
      <View className="flex-row items-center gap-2">
        <Paperclip size={16} color={colors.textSecondary} />
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          {t('attachments.title')}
        </Text>
        {attachments.length > 0 && (
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{attachments.length}</Text>
        )}
      </View>

      {isLoading ? (
        <View className="gap-2" testID="attachment-loading">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </View>
      ) : attachments.length === 0 ? (
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark" testID="attachment-empty">
          {t('attachments.empty')}
        </Text>
      ) : (
        <View className="gap-2">
          {attachments.map(attachment => (
            <AttachmentRow key={attachment.id} attachment={attachment} />
          ))}
        </View>
      )}

      <UploadControl ownerType={ownerType} ownerId={ownerId} currentCount={attachments.length} />

      {children}
    </View>
  );
}

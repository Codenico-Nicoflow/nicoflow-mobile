import { useRef } from 'react';
import { Text, View } from 'react-native';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { USER_STATUS } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAppUser, useGetStorageUsageQuery } from '@/lib/store';

import { AddAttachmentSheet, type AddAttachmentSheetRef } from './AddAttachmentSheet';
import { StorageBar } from './StorageBar';
import { UploadProgressRow } from './UploadProgressRow';
import { useAttachmentUpload } from './useAttachmentUpload';

interface UploadControlProps {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  /** Confirmed attachments already on this owner, for the count cap. */
  currentCount: number;
}

// The "Add attachment" affordance plus in-flight rows.
//
// Writes are Pro-only (SPEC §5), so a free user sees the upsell line instead of
// the button — but never loses access to the list above it: existing files stay
// visible and downloadable after a downgrade.
export function UploadControl({ ownerType, ownerId, currentCount }: UploadControlProps) {
  const { t } = useTranslation('task');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;
  const sheetRef = useRef<AddAttachmentSheetRef>(null);

  const { uploads, upload, retry, remove, isAtCap } = useAttachmentUpload(ownerType, ownerId, currentCount);
  // Account-wide usage is a Pro-only surface, so don't fetch it otherwise.
  const { data: storage, isLoading: isStorageLoading } = useGetStorageUsageQuery(undefined, { skip: !isPro });

  if (!isPro) {
    return (
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" testID="attachment-pro-gate">
        {t('attachments.proHintReader')}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {uploads.map(item => (
        <UploadProgressRow key={item.id} item={item} onRetry={id => void retry(id)} onRemove={remove} />
      ))}

      <Button
        variant="outline"
        size="sm"
        label={t('attachments.addButton')}
        onPress={() => sheetRef.current?.present()}
        disabled={isAtCap}
        testID="attachment-add"
      />
      {isAtCap && (
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" testID="attachment-cap">
          {t('attachments.countCap')}
        </Text>
      )}

      {storage && (
        <StorageBar usedBytes={storage.usedBytes} limitBytes={storage.limitBytes} isLoading={isStorageLoading} />
      )}

      <AddAttachmentSheet ref={sheetRef} onPicked={file => void upload(file)} />
    </View>
  );
}

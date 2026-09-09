import { useRef } from 'react';
import { Text, View } from 'react-native';

import type { AttachmentOwnerType } from '@nicoflow/shared/types';
import { USER_STATUS } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppUser } from '@/lib/store';

import { AddAttachmentSheet, type AddAttachmentSheetRef } from './AddAttachmentSheet';
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

  const { uploads, upload, isAtCap } = useAttachmentUpload(ownerType, ownerId, currentCount);

  if (!isPro) {
    return (
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" testID="attachment-pro-gate">
        {t('attachments.proHint')}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {uploads.map(item => (
        <View key={item.id} className="gap-1" testID={`attachment-upload-${item.id}`}>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={1}>
            {item.status === 'error' ? t('attachments.uploadFailed', { name: item.name }) : item.name}
          </Text>
          {item.status === 'uploading' && <Skeleton className="h-1 w-full" />}
        </View>
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

      <AddAttachmentSheet ref={sheetRef} onPicked={file => void upload(file)} />
    </View>
  );
}

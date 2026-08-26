import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import type { IBucket } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useUpdateBucketMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/toast';

interface BucketEditSheetProps {
  bucket: IBucket | null;
}

// Mirrors web's BucketEditDialog (nicoflow-frontend/src/features/Bucket/components/BucketEditDialog).
//
// Sheet's onDismiss below is wired ONLY to reset local state on close (any
// cause — submit, swipe-down, backdrop tap) — it never itself calls
// .dismiss(). Submit closes the sheet by calling .dismiss() on the owned
// ref. Calling .dismiss() from inside a handler that IS the onDismiss
// callback (or vice versa) double-fires the close animation and leaves the
// underlying BottomSheetModal's present() a no-op next time it opens — see
// BucketDeleteAlert for the same fix.
export const BucketEditSheet = forwardRef<SheetRef, BucketEditSheetProps>(function BucketEditSheet({ bucket }, ref) {
  const { t } = useTranslation(['bucket', 'common']);
  const [updateBucket, { isLoading }] = useUpdateBucketMutation();
  const [content, setContent] = useState('');
  const sheetRef = useRef<SheetRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  useEffect(() => {
    if (bucket) setContent(bucket.content);
  }, [bucket]);

  const handleSubmit = async () => {
    if (!bucket) return;
    try {
      await updateBucket({ id: bucket.id, data: { content } }).unwrap();
      showSuccessToast(ToastMessages.BUCKET_UPDATED, toast);
      sheetRef.current?.dismiss();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const hasChanges = bucket !== null && content.trim() !== bucket.content;

  return (
    <Sheet ref={sheetRef} snapPoints={['55%']}>
      <SheetHeader>
        <SheetTitle>{t('editDialog.title')}</SheetTitle>
        <SheetDescription>{t('editDialog.description')}</SheetDescription>
      </SheetHeader>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
          {t('editDialog.contentLabel')}
        </Text>
        <Textarea
          value={content}
          onChangeText={setContent}
          placeholder={t('editDialog.contentPlaceholder')}
          maxLength={500}
          className="min-h-[120px]"
          testID="bucket-edit-content"
        />
      </View>

      <SheetFooter>
        <Button
          label={t('common:actions.save')}
          onPress={() => void handleSubmit()}
          disabled={isLoading || !hasChanges || content.trim() === ''}
          loading={isLoading}
          testID="bucket-edit-submit"
        />
      </SheetFooter>
    </Sheet>
  );
});

import { Text, useColorScheme, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { type BucketFormData, bucketSchema } from '@nicoflow/shared/schemas';
import { Inbox as InboxIcon, Sparkles } from 'lucide-react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useRetryableMutation } from '@/hooks/useRetryableMutation';
import { useCreateBucketMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';

const MAX_LENGTH = 500;

export function InboxCapture() {
  const { t } = useTranslation('bucket');
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const runCreate = useRetryableMutation(createBucket);
  const isDark = useColorScheme() === 'dark';

  const { control, handleSubmit, reset } = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: { content: '' },
  });

  const content = useWatch({ control, name: 'content' });

  const onSubmit = async (data: BucketFormData) => {
    const result = await runCreate(data);
    if (!result) return;
    // Only clear on success — a failed capture must never lose what the
    // user typed (AC4), and react-hook-form leaves the field untouched
    // unless reset() is called.
    reset({ content: '' });
    showSuccessToast(ToastMessages.BUCKET_CREATED, toast);
  };

  return (
    <View className="gap-3 rounded-xl border border-border dark:border-border-dark bg-card/50 dark:bg-card-dark/50 p-4">
      <View className="flex-row items-center gap-2">
        <Sparkles size={16} color={isDark ? '#6366f1' : '#4f46e5'} />
        <View>
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('page.captureHeading')}
          </Text>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('page.captureHint')}</Text>
        </View>
      </View>

      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <Textarea
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            maxLength={MAX_LENGTH}
            placeholder={t('quickInput.defaultPlaceholder')}
          />
        )}
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {content.length}/{MAX_LENGTH}
        </Text>
        <Button onPress={handleSubmit(onSubmit)} loading={isLoading} disabled={!content.trim()}>
          <InboxIcon size={16} color="#ffffff" />
          <Text className="text-sm font-medium text-primary-foreground">
            {isLoading ? t('quickInput.submitting') : t('quickInput.submit')}
          </Text>
        </Button>
      </View>
    </View>
  );
}

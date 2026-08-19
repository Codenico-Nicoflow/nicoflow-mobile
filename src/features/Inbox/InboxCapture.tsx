import { zodResolver } from '@hookform/resolvers/zod';
import { bucketSchema, type BucketFormData } from '@nicoflow/shared/schemas';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBucketMutation } from '@/lib/store';

const MAX_LENGTH = 500;

export function InboxCapture() {
  const [createBucket, { isLoading }] = useCreateBucketMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BucketFormData>({
    resolver: zodResolver(bucketSchema),
    defaultValues: { content: '' },
  });

  const content = useWatch({ control, name: 'content' });

  const onSubmit = async (data: BucketFormData) => {
    try {
      await createBucket(data).unwrap();
      // Only clear on success — a failed capture must never lose what the
      // user typed (AC4), and react-hook-form leaves the field untouched
      // unless reset() is called.
      reset({ content: '' });
    } catch {
      setError('root', { message: 'Couldn’t save. Check your connection and try again.' });
    }
  };

  return (
    <View className="gap-2">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <Textarea
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            maxLength={MAX_LENGTH}
            placeholder="Capture a thought…"
            error={!!errors.content}
          />
        )}
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {content.length}/{MAX_LENGTH}
        </Text>
        <Button label="Capture" onPress={handleSubmit(onSubmit)} loading={isLoading} disabled={!content.trim()} />
      </View>
    </View>
  );
}

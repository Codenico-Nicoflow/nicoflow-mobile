import { zodResolver } from '@hookform/resolvers/zod';
import { bucketSchema, type BucketFormData } from '@nicoflow/shared/schemas';
import { Sparkles } from 'lucide-react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, useColorScheme, View } from 'react-native';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBucketMutation } from '@/lib/store';

const MAX_LENGTH = 500;

export function InboxCapture() {
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const isDark = useColorScheme() === 'dark';

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
    <View className="gap-3 rounded-xl border border-border dark:border-border-dark bg-card/50 dark:bg-card-dark/50 p-4">
      <View className="flex-row items-center gap-2">
        <Sparkles size={16} color={isDark ? '#6366f1' : '#4f46e5'} />
        <View>
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Quick capture</Text>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            Jot down anything — sort it out later.
          </Text>
        </View>
      </View>

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

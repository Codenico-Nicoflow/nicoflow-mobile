import { Pressable, Text, View } from 'react-native';

import { RotateCw, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

import type { UploadItem } from './useAttachmentUpload';

interface UploadProgressRowProps {
  item: UploadItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

// One in-flight or failed upload. While uploading it shows a determinate bar —
// a spinner stops being honest once a photo takes more than a second or two.
// On failure the bar is replaced by retry + remove, so a transient network drop
// costs a tap rather than re-picking the file.
export function UploadProgressRow({ item, onRetry, onRemove }: UploadProgressRowProps) {
  const { t } = useTranslation('task');
  const colors = useTheme();
  const isError = item.status === 'error';
  // Clamped here as well as at the source: a ratio above 1 would render a fill
  // wider than its own track.
  const percent = Math.round(Math.min(1, Math.max(0, item.progress)) * 100);

  return (
    <View className="gap-1" testID={`attachment-upload-${item.id}`}>
      <View className="flex-row items-center gap-2">
        <Text
          className={`min-w-0 flex-1 text-xs ${isError ? 'text-destructive' : 'text-muted-foreground dark:text-muted-foreground-dark'}`}
          numberOfLines={1}
        >
          {isError ? t('attachments.uploadFailed', { name: item.name }) : item.name}
        </Text>

        {isError ? (
          <>
            <Pressable
              onPress={() => onRetry(item.id)}
              accessibilityRole="button"
              accessibilityLabel={t('attachments.retry')}
              testID={`attachment-retry-${item.id}`}
              className="p-1"
            >
              <RotateCw size={14} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => onRemove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={t('attachments.remove')}
              testID={`attachment-remove-${item.id}`}
              className="p-1"
            >
              <X size={14} color={colors.textSecondary} />
            </Pressable>
          </>
        ) : (
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{percent}%</Text>
        )}
      </View>

      {!isError && (
        <View
          className="h-1 w-full overflow-hidden rounded bg-muted dark:bg-muted-dark"
          accessibilityRole="progressbar"
          accessibilityLabel={item.name}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          testID={`attachment-progress-${item.id}`}
        >
          <View className="h-full rounded bg-primary" style={{ width: `${percent}%` }} />
        </View>
      )}
    </View>
  );
}

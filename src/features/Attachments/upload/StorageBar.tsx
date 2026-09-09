import { Text, View } from 'react-native';

import { formatBytes } from '@nicoflow/shared/utils';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

interface StorageBarProps {
  usedBytes: number;
  limitBytes: number;
  isLoading?: boolean;
}

// Approaching the cap, the fill warns rather than staying calm — the point is
// to be noticed before an upload is refused.
const WARN_AT = 0.8;

// Account-wide storage usage (Pro only — the caller skips the query otherwise).
// Port of web's StorageBar.
export function StorageBar({ usedBytes, limitBytes, isLoading = false }: StorageBarProps) {
  const { t } = useTranslation('task');

  if (isLoading) return <Skeleton className="h-1 w-full" />;

  // Guard a zero/absent limit so a bad payload can never produce NaN/Infinity.
  const ratio = limitBytes > 0 ? Math.min(1, usedBytes / limitBytes) : 0;
  const percent = Math.round(ratio * 100);
  const isWarning = ratio >= WARN_AT;

  return (
    <View className="gap-1" testID="attachment-storage-bar">
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        {t('attachments.storageUsage', { used: formatBytes(usedBytes), total: formatBytes(limitBytes) })}
      </Text>
      <View
        className="h-1 w-full overflow-hidden rounded bg-muted dark:bg-muted-dark"
        accessibilityRole="progressbar"
        accessibilityLabel={t('attachments.storageLabel')}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        testID="attachment-storage-fill"
      >
        <View
          className={`h-full rounded ${isWarning ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}

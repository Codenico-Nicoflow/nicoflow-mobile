import { FlatList, Pressable, Text, useColorScheme, View } from 'react-native';

import { router } from 'expo-router';

import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { Archive, ArrowUpRight, CheckSquare, FileText, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

import { relativeTime } from './relativeTime';

// Mirrors web's ArchivedBucketItem destination logic (nicoflow-frontend/src/features/Bucket/components/ArchivedBucketItem/index.tsx).
const viewCreatedDestination = (item: IBucket): `/note/${string}` | `/task/${string}` | null => {
  if (item.createdNoteId) return `/note/${item.createdNoteId}`;
  if (item.createdTaskId) return `/task/${item.createdTaskId}`;
  return null;
};

interface ArchivedListProps {
  items: IBucket[];
  isLoading: boolean;
}

// Mirrors web's RESULT_META (nicoflow-frontend/src/features/Bucket/components/ArchivedBucketItem/index.tsx):
// a bucket item's processing result gets one consistent color across its
// left border and result badge — success/green for tasks, primary/blue for
// notes, muted/gray for trash. Kept local rather than extracted to
// lib/constants since it's the only consumer.
const RESULT_META: Record<
  ProcessingResult,
  {
    Icon: typeof CheckSquare;
    labelKey: string;
    border: string;
    badgeClass: string;
    badgeTextClass: string;
    iconColor: string;
    iconColorDark: string;
  }
> = {
  [ProcessingResult.TASK]: {
    Icon: CheckSquare,
    labelKey: 'page.result.task',
    border: 'border-s-emerald-500/50 dark:border-s-emerald-400/50',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10',
    badgeTextClass: 'text-emerald-600 dark:text-emerald-400',
    iconColor: '#059669',
    iconColorDark: '#34d399',
  },
  [ProcessingResult.NOTE]: {
    Icon: FileText,
    labelKey: 'page.result.note',
    border: 'border-s-sky-500/50 dark:border-s-sky-400/50',
    badgeClass: 'border-sky-500/30 bg-sky-500/10',
    badgeTextClass: 'text-sky-600 dark:text-sky-400',
    iconColor: '#0284c7',
    iconColorDark: '#38bdf8',
  },
  [ProcessingResult.TRASH]: {
    Icon: Trash2,
    labelKey: 'page.result.trash',
    border: 'border-s-muted-foreground/25 dark:border-s-muted-foreground-dark/25',
    badgeClass: 'border-muted-foreground/25 bg-muted dark:bg-muted-dark',
    badgeTextClass: 'text-muted-foreground dark:text-muted-foreground-dark',
    iconColor: '#64748b',
    iconColorDark: '#94a3b8',
  },
};

export function ArchivedList({ items, isLoading }: ArchivedListProps) {
  const { t } = useTranslation('bucket');
  const isDark = useColorScheme() === 'dark';

  return (
    <FlatList
      data={isLoading ? [] : items}
      keyExtractor={item => item.id}
      contentContainerClassName="gap-2 pb-4"
      renderItem={({ item }) => {
        const meta = RESULT_META[item.processingResult ?? ProcessingResult.TRASH];
        const destination = viewCreatedDestination(item);
        return (
          <View
            className={`flex-row items-start gap-2 rounded-lg border-s-4 border border-border dark:border-border-dark bg-muted/40 dark:bg-muted-dark/40 px-3 py-2.5 ${meta.border}`}
            testID={`archived-bucket-${item.id}`}
          >
            <View className="flex-1 gap-1">
              <Text className="text-sm text-foreground dark:text-foreground-dark" numberOfLines={2}>
                {item.content}
              </Text>
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                {t('page.processedTimestamp')} {relativeTime(item.processedAt ?? item.updatedAt)}
              </Text>
              {destination && (
                <Pressable
                  className="flex-row items-center gap-1 self-start"
                  onPress={() => router.push(destination)}
                  testID="bucket-view-created"
                  accessibilityRole="link"
                  accessibilityLabel={t('page.viewCreated')}
                >
                  <Text className="text-xs font-medium text-primary dark:text-primary-dark">
                    {t('page.viewCreated')}
                  </Text>
                  <ArrowUpRight size={12} color={isDark ? '#6366f1' : '#4f46e5'} />
                </Pressable>
              )}
            </View>
            <Badge
              variant="outline"
              className={meta.badgeClass}
              textClassName={meta.badgeTextClass}
              icon={<meta.Icon size={12} color={isDark ? meta.iconColorDark : meta.iconColor} />}
            >
              {t(meta.labelKey)}
            </Badge>
          </View>
        );
      }}
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState
            icon={Archive}
            title={t('page.archived.emptyTitle')}
            description={t('page.archived.emptyDescription')}
            testID="archived-empty"
          />
        )
      }
    />
  );
}

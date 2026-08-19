import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { Archive, CheckSquare, FileText, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, useColorScheme, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';

interface ArchivedListProps {
  items: IBucket[];
  isLoading: boolean;
}

export function ArchivedList({ items, isLoading }: ArchivedListProps) {
  const { t } = useTranslation('bucket');
  const mutedColor = useColorScheme() === 'dark' ? '#94a3b8' : '#64748b';

  const RESULT_META: Record<ProcessingResult, { Icon: typeof CheckSquare; label: string }> = {
    [ProcessingResult.TASK]: { Icon: CheckSquare, label: t('page.result.task') },
    [ProcessingResult.NOTE]: { Icon: FileText, label: t('page.result.note') },
    [ProcessingResult.TRASH]: { Icon: Trash2, label: t('page.result.trash') },
  };

  return (
    <FlatList
      data={isLoading ? [] : items}
      keyExtractor={item => item.id}
      contentContainerClassName="gap-2 pb-4"
      renderItem={({ item }) => {
        const meta = RESULT_META[item.processingResult ?? ProcessingResult.TRASH];
        return (
          <View
            className="flex-row items-start gap-2 rounded-lg border border-border dark:border-border-dark bg-muted/40 dark:bg-muted-dark/40 px-3 py-2.5"
            testID={`archived-bucket-${item.id}`}>
            <Text className="flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
              {item.content}
            </Text>
            <View className="flex-row items-center gap-1 rounded-md border border-border dark:border-border-dark px-2 py-0.5">
              <meta.Icon size={12} color={mutedColor} />
              <Text className="text-xs text-foreground dark:text-foreground-dark">{meta.label}</Text>
            </View>
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

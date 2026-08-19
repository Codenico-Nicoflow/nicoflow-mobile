import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { Archive, CheckSquare, FileText, Trash2 } from 'lucide-react-native';
import { FlatList, Text, useColorScheme, View } from 'react-native';

const RESULT_META: Record<ProcessingResult, { Icon: typeof CheckSquare; label: string }> = {
  [ProcessingResult.TASK]: { Icon: CheckSquare, label: 'Task' },
  [ProcessingResult.NOTE]: { Icon: FileText, label: 'Note' },
  [ProcessingResult.TRASH]: { Icon: Trash2, label: 'Trash' },
};

interface ArchivedListProps {
  items: IBucket[];
  isLoading: boolean;
}

export function ArchivedList({ items, isLoading }: ArchivedListProps) {
  const mutedColor = useColorScheme() === 'dark' ? '#94a3b8' : '#64748b';

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
          <View className="items-center justify-center py-12 gap-2" testID="archived-empty">
            <Archive size={24} color={mutedColor} />
            <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
              Nothing archived yet
            </Text>
          </View>
        )
      }
    />
  );
}

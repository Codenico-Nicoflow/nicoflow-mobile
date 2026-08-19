import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { CheckSquare, ChevronDown, ChevronRight, FileText, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const RESULT_META: Record<ProcessingResult, { Icon: typeof CheckSquare; label: string }> = {
  [ProcessingResult.TASK]: { Icon: CheckSquare, label: 'Task' },
  [ProcessingResult.NOTE]: { Icon: FileText, label: 'Note' },
  [ProcessingResult.TRASH]: { Icon: Trash2, label: 'Trash' },
};

interface ArchivedSectionProps {
  items: IBucket[];
}

export function ArchivedSection({ items }: ArchivedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => setExpanded(v => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-2 py-2">
        {expanded ? (
          <ChevronDown size={16} className="text-muted-foreground dark:text-muted-foreground-dark" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground dark:text-muted-foreground-dark" />
        )}
        <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
          Archived ({items.length})
        </Text>
      </Pressable>

      {expanded && (
        <View className="gap-2">
          {items.map(item => {
            const meta = RESULT_META[item.processingResult ?? ProcessingResult.TRASH];
            return (
              <View
                key={item.id}
                className="flex-row items-start gap-2 rounded-xl border border-border dark:border-border-dark bg-muted/40 dark:bg-muted-dark/40 p-3"
                testID={`archived-bucket-${item.id}`}>
                <Text className="flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
                  {item.content}
                </Text>
                <View className="flex-row items-center gap-1 rounded-md border border-border dark:border-border-dark px-2 py-0.5">
                  <meta.Icon size={12} className="text-muted-foreground dark:text-muted-foreground-dark" />
                  <Text className="text-xs text-foreground dark:text-foreground-dark">{meta.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

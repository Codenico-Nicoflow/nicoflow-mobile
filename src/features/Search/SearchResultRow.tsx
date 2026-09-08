import { Pressable, Text, View } from 'react-native';

import { ChevronRight, FolderIcon, Layers3, ListTodo, NotebookPen } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

import { highlightMatch } from './highlightMatch';
import { KIND_ICON_COLOR, KIND_TILE, type ResultKind } from './types';

const KIND_ICON = {
  task: ListTodo,
  project: FolderIcon,
  area: Layers3,
  note: NotebookPen,
} as const;

interface SearchResultRowProps {
  kind: ResultKind;
  title: string;
  /** Secondary line — project/area name, or a note excerpt when unparented. */
  meta?: string;
  /** Query to highlight inside the title. */
  query: string;
  onPress: () => void;
  testID: string;
}

// One result row: tinted type tile, highlighted title, optional meta line.
// Mirrors web's ResultRow in the command palette.
export function SearchResultRow({ kind, title, meta, query, onPress, testID }: SearchResultRowProps) {
  const colors = useTheme();
  const Icon = KIND_ICON[kind];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      className="flex-row items-center gap-3 px-3 py-2.5 active:bg-accent dark:active:bg-accent-dark"
    >
      <View className={`h-9 w-9 items-center justify-center rounded-lg ${KIND_TILE[kind]}`}>
        <Icon size={16} color={KIND_ICON_COLOR[kind]} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark" numberOfLines={1}>
          {highlightMatch(title, query)}
        </Text>
        {!!meta && (
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>

      <ChevronRight size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

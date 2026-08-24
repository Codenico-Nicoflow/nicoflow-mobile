import { Text, View } from 'react-native';

import { Link2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useGetBacklinksQuery } from '@/lib/store';

interface BacklinksPanelProps {
  noteId: string;
}

// Mirrors web's BacklinksPanel: heading "Linked mentions", empty state when
// no other note @-mentions this one, pluralized count when there are.
export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const { t } = useTranslation('notes');
  const { data: backlinks } = useGetBacklinksQuery(noteId);
  const notes = backlinks ?? [];

  return (
    <View className="gap-2 border-t border-border dark:border-border-dark pt-3" testID="note-backlinks">
      <View className="flex-row items-center gap-2">
        <Link2 size={16} color="#64748b" />
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          {t('backlinks.heading')}
        </Text>
      </View>

      {notes.length === 0 ? (
        <View className="gap-1">
          <Text className="text-sm text-foreground dark:text-foreground-dark">{t('backlinks.emptyTitle')}</Text>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('backlinks.emptyDescription')}
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t(notes.length === 1 ? 'backlinks.count_one' : 'backlinks.count_other', { count: notes.length })}
          </Text>
          {notes.map(note => (
            <Text
              key={note.id}
              className="text-sm text-foreground dark:text-foreground-dark"
              numberOfLines={1}
              testID={`backlink-${note.id}`}
            >
              {note.title || t('list.untitled')}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

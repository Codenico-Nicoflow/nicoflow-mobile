import { Pressable, Text } from 'react-native';

import { type INote } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { formatRelativeTime } from '@/lib/utils/relativeTime';

interface NoteRowProps {
  note: INote;
  onOpen: (id: string) => void;
}

// Mirrors web's NoteRow.tsx: title (fallback "Untitled note"), excerpt
// (fallback "Empty note", 2-line clamp, server-computed — never derived
// client-side), relative updatedAt. No `content` field exists on this list
// shape at all, so this row can never be an editor's data source.
//
// Shared between the project note list (Project/notes/NotesSection) and the
// backlinks panel (Notes/page/BacklinksPanel) — both consume the same INote[]
// shape, same as web's list/NoteRow.tsx is shared between its NotesSection
// and BacklinksPanel.
export function NoteRow({ note, onOpen }: NoteRowProps) {
  const { t } = useTranslation('notes');

  return (
    <Pressable
      onPress={() => onOpen(note.id)}
      accessibilityRole="button"
      testID={`note-row-${note.id}`}
      className="gap-1 rounded-md border border-border dark:border-border-dark px-3 py-2.5 active:bg-accent dark:active:bg-accent-dark"
    >
      <Text
        className="text-sm font-medium text-foreground dark:text-foreground-dark"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {note.title || t('list.untitled')}
      </Text>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
        {note.excerpt || t('list.noExcerpt')}
      </Text>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        {formatRelativeTime(note.updatedAt)}
      </Text>
    </Pressable>
  );
}

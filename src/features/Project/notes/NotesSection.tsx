import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import { router } from 'expo-router';

import { EMPTY_TIPTAP_DOC } from '@nicoflow/shared/types';
import { AlertTriangle, NotebookPen, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { NoteRow } from '@/features/Notes/list/NoteRow';
import { useCreateNoteMutation, useGetNotesInfiniteQuery } from '@/lib/store';

interface NotesSectionProps {
  projectId: string;
}

function NotesLoadingState() {
  return (
    <View className="gap-2" testID="notes-loading">
      {[0, 1, 2].map(i => (
        <Skeleton key={i} className="h-16 w-full rounded-md" />
      ))}
    </View>
  );
}

// Mirrors web's NotesSection.tsx: heading + "New note" (disabled while
// creating), skeleton loading, load-error retry, empty state ABOVE the
// still-visible heading/create button, server updatedAt-DESC order (never
// client-sorted). Notes are free+unlimited — this surface never renders a
// plan-limit alert.
export function NotesSection({ projectId }: NotesSectionProps) {
  const { t } = useTranslation('notes');
  const {
    data: notesData,
    isLoading,
    isError,
    refetch,
  } = useGetNotesInfiniteQuery({ projectId }, { skip: !projectId });
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();

  const notes = useMemo(() => notesData?.pages.flatMap(p => p.items) ?? [], [notesData]);

  const handleCreate = async () => {
    try {
      const note = await createNote({
        projectId,
        title: t('list.untitled'),
        content: EMPTY_TIPTAP_DOC,
      }).unwrap();
      router.push(`/note/${note.id}`);
    } catch {
      toast.error(t('list.createError'));
    }
  };

  return (
    <View className="flex-1 px-4 pt-3" testID="notes-section">
      <View className="flex-row items-center justify-between gap-2 pb-3">
        <View className="flex-row items-center gap-2">
          <NotebookPen size={16} color="#64748b" />
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{t('list.heading')}</Text>
        </View>
        <Button size="sm" onPress={() => void handleCreate()} disabled={isCreating} testID="notes-create">
          <Plus size={16} color="#ffffff" />
          <Text className="text-sm font-medium text-primary-foreground">{t('list.new')}</Text>
        </Button>
      </View>

      {isLoading ? (
        <NotesLoadingState />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('list.loadErrorTitle')}
          description={t('list.loadErrorDescription')}
          action={<Button label={t('list.retry')} variant="outline" onPress={() => void refetch()} />}
          testID="notes-error"
        />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={t('list.emptyTitle')}
          description={t('list.emptyDescription')}
          testID="notes-empty"
        />
      ) : (
        <FlatList
          testID="notes-list"
          style={{ flex: 1 }}
          data={notes}
          keyExtractor={note => note.id}
          renderItem={({ item: note }) => <NoteRow note={note} onOpen={id => router.push(`/note/${id}`)} deletable />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

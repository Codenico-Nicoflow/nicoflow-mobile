import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, useColorScheme, View } from 'react-native';

import { router } from 'expo-router';

import { type TiptapDoc } from '@nicoflow/shared/types';
import { ArrowLeft, FileX, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogRef,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/toast';
import { useDeleteNoteMutation, useGetNoteQuery } from '@/lib/store';

import { ConflictNotice, SaveStatusIndicator, useNoteAutosave } from '../autosave';
import { NoteEditor } from '../editor/NoteEditor';

import { BacklinksPanel } from './BacklinksPanel';
import { NoteEditorSkeleton } from './NoteEditorSkeleton';

interface NoteEditorPageProps {
  noteId: string;
}

// Mirrors web's NoteEditorPage.tsx: scalar fetch -> title + WebView-Tiptap
// body -> autosave status -> backlinks -> delete. This is the
// highest-risk-of-silent-data-loss surface in the epic (per NIC-1984's own
// description), so the autosave/conflict/flush-on-nav wiring below matches
// web's useNoteAutosave line-for-line intent, not just its shape.
export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const { t } = useTranslation(['notes', 'common']);
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const { data: note, isLoading, isError } = useGetNoteQuery(noteId, { skip: !noteId });
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();
  const deleteRef = useRef<AlertDialogRef>(null);

  const [title, setTitle] = useState('');
  const [contentError, setContentError] = useState(false);

  const { status, save, flush, isConflicted } = useNoteAutosave({
    noteId,
    initialVersion: note?.version ?? 0,
  });

  const loadedTitle = note?.title;
  const loadedId = note?.id;
  useEffect(() => {
    if (loadedId !== undefined) setTitle(loadedTitle ?? '');
  }, [loadedId, loadedTitle]);

  if (isLoading) return <NoteEditorSkeleton />;

  if (isError || !note) {
    return (
      <EmptyState
        icon={FileX}
        title={t('notes:page.notFoundTitle')}
        description={t('notes:page.notFoundDescription')}
        action={<Button label={t('notes:page.back')} variant="outline" onPress={() => router.replace('/areas')} />}
        testID="note-not-found"
      />
    );
  }

  const backTo = note.projectId ? `/project/${note.projectId}` : '/areas';

  const handleDelete = async () => {
    try {
      await deleteNote(note.id).unwrap();
      deleteRef.current?.dismiss();
      router.replace(backTo);
    } catch {
      deleteRef.current?.dismiss();
      toast.error(t('notes:page.deleteError'));
    }
  };

  const handleBack = () => {
    flush();
    router.back();
  };

  return (
    <View className="flex-1 px-4 pt-3 gap-3" testID="note-editor-page">
      <View className="flex-row items-center justify-between gap-2">
        <Button variant="ghost" onPress={handleBack} testID="note-back">
          <ArrowLeft size={16} color={mutedColor} />
          <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">{t('notes:page.back')}</Text>
        </Button>

        <View className="flex-row items-center gap-2">
          <SaveStatusIndicator status={status} />
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={t('notes:page.delete')}
            onPress={() => deleteRef.current?.present()}
            testID="note-delete"
          >
            <Trash2 size={16} color={mutedColor} />
          </Button>
        </View>
      </View>

      {isConflicted && <ConflictNotice onReload={() => router.replace(`/note/${noteId}`)} />}

      <TextInput
        value={title}
        accessibilityLabel={t('notes:page.titleLabel')}
        placeholder={t('notes:page.titlePlaceholder')}
        placeholderTextColor={mutedColor}
        maxLength={255}
        editable={!isConflicted && !contentError}
        onChangeText={next => {
          setTitle(next);
          if (next.trim() !== '') save({ title: next });
        }}
        testID="note-title"
        className="text-2xl font-semibold text-foreground dark:text-foreground-dark"
      />

      <NoteEditor
        content={note.content}
        editable={!isConflicted && !contentError}
        onChange={(content: TiptapDoc) => save({ content })}
        onContentError={() => setContentError(true)}
      />

      {contentError && (
        <Text
          className="text-sm text-destructive dark:text-destructive-dark"
          accessibilityRole="alert"
          testID="note-content-error"
        >
          {t('notes:editor.contentError')}
        </Text>
      )}

      <BacklinksPanel noteId={note.id} />

      <AlertDialog ref={deleteRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('notes:page.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('notes:page.deleteConfirmBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => void handleDelete()}>
            {isDeleting ? `${t('notes:page.deleteConfirmAction')}...` : t('notes:page.deleteConfirmAction')}
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => deleteRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  );
}

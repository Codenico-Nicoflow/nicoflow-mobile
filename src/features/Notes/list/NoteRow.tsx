import { useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type INote } from '@nicoflow/shared/types';
import { Trash2 } from 'lucide-react-native';
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
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { SwipeableRow, type SwipeableRowHandle } from '@/components/ui/swipeable-row';
import { toast } from '@/components/ui/toast';
import { useDeleteNoteMutation } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils/relativeTime';

interface NoteRowProps {
  note: INote;
  onOpen: (id: string) => void;
  /**
   * Omit to render read-only (no menu, no swipe) — the backlinks panel shares
   * this row but a note shouldn't be deletable from a "what links here" view.
   * Project's own note list passes true.
   */
  deletable?: boolean;
}

// Mirrors web's NoteRow.tsx: title (fallback "Untitled note"), excerpt
// (fallback "Empty note", 2-line clamp, server-computed — never derived
// client-side), relative updatedAt, 3-dot menu (Delete only) + swipe-to-delete
// reusing the same SwipeableRow/confirm-gate pattern as tasks — a destructive
// swipe action must always confirm, never fire straight off the gesture.
//
// Shared between the project note list (Project/notes/NotesSection) and the
// backlinks panel (Notes/page/BacklinksPanel) — both consume the same INote[]
// shape, same as web's list/NoteRow.tsx is shared between its NotesSection
// and BacklinksPanel. Only the project list passes deletable.
export function NoteRow({ note, onOpen, deletable = false }: NoteRowProps) {
  const { t } = useTranslation(['notes', 'common']);
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const swipeRef = useRef<SwipeableRowHandle>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const openDeleteConfirm = () => {
    setPendingDelete(true);
    alertRef.current?.present();
  };

  const onConfirmDelete = async () => {
    try {
      await deleteNote(note.id).unwrap();
    } catch {
      toast.errorWithRetry(t('notes:page.deleteError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onConfirmDelete();
        },
      });
      return;
    }
    setPendingDelete(false);
    alertRef.current?.dismiss();
    swipeRef.current?.close();
  };

  const row = (
    <Pressable
      onPress={() => onOpen(note.id)}
      accessibilityRole="button"
      testID={`note-row-${note.id}`}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      className="rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark px-3 py-2.5 active:bg-accent dark:active:bg-accent-dark"
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          className="text-sm font-medium text-foreground dark:text-foreground-dark"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {note.title || t('notes:list.untitled')}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
          {note.excerpt || t('notes:list.noExcerpt')}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {formatRelativeTime(note.updatedAt)}
        </Text>
      </View>

      {deletable && (
        <DropdownMenu
          ref={menuRef}
          trigger={
            <View accessibilityLabel={t('notes:page.delete')} className="p-1">
              <Trash2 size={16} color={mutedColor} />
            </View>
          }
        >
          <DropdownMenuItem
            icon={<Trash2 size={16} color={isDark ? '#f87171' : '#ef4444'} />}
            variant="destructive"
            onPress={() => {
              menuRef.current?.dismiss();
              openDeleteConfirm();
            }}
          >
            {t('notes:page.delete')}
          </DropdownMenuItem>
        </DropdownMenu>
      )}
    </Pressable>
  );

  if (!deletable) return row;

  return (
    <>
      <SwipeableRow
        ref={swipeRef}
        right={{
          tone: 'destructive',
          icon: <Trash2 size={20} color="#ffffff" />,
          onPress: openDeleteConfirm,
          onOpen: openDeleteConfirm,
        }}
      >
        {row}
      </SwipeableRow>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('notes:page.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('notes:page.deleteConfirmBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) void onConfirmDelete();
            }}
          >
            {isDeleting ? `${t('notes:page.deleteConfirmAction')}...` : t('notes:page.deleteConfirmAction')}
          </AlertDialogAction>
          <AlertDialogCancel
            onPress={() => {
              setPendingDelete(false);
              alertRef.current?.dismiss();
              swipeRef.current?.close();
            }}
          >
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </>
  );
}

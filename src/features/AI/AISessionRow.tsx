import { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';

import type { AISessionView } from '@nicoflow/shared/api';
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
import { SwipeableRow, type SwipeableRowHandle } from '@/components/ui/swipeable-row';
import { toast } from '@/components/ui/toast';
import { useDeleteAISessionMutation } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils/relativeTime';

interface AISessionRowProps {
  session: AISessionView;
  isActive?: boolean;
  onOpen: (id: string) => void;
  /** Called after a successful delete so the owner can leave a deleted session. */
  onDeleted?: (id: string) => void;
}

// One conversation row: title + relative updatedAt, swipe-to-delete behind a
// confirm gate (a destructive swipe never fires straight off the gesture).
// Active row is tinted with --primary, matching web's AISessionList highlight.
export function AISessionRow({ session, isActive = false, onOpen, onDeleted }: AISessionRowProps) {
  const { t } = useTranslation(['ai', 'common']);
  const [deleteSession, { isLoading: isDeleting }] = useDeleteAISessionMutation();
  const alertRef = useRef<AlertDialogRef>(null);
  const swipeRef = useRef<SwipeableRowHandle>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const openDeleteConfirm = () => {
    setPendingDelete(true);
    alertRef.current?.present();
  };

  const onConfirmDelete = async () => {
    try {
      await deleteSession(session.id).unwrap();
    } catch {
      toast.errorWithRetry(t('ai:sessions.loadErrorTitle'), {
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
    onDeleted?.(session.id);
  };

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
        <Pressable
          onPress={() => onOpen(session.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          testID={`ai-session-${session.id}`}
          className={`rounded-md border px-3 py-2.5 ${
            isActive
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-border dark:border-border-dark bg-card dark:bg-card-dark active:bg-accent dark:active:bg-accent-dark'
          }`}
        >
          <Text
            className="text-sm font-medium text-foreground dark:text-foreground-dark"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {session.title}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {formatRelativeTime(session.updatedAt)}
          </Text>
        </Pressable>
      </SwipeableRow>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('ai:sessions.delete')}</AlertDialogTitle>
          <AlertDialogDescription>{t('ai:sessions.deleteConfirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) void onConfirmDelete();
            }}
          >
            {isDeleting ? `${t('ai:sessions.delete')}...` : t('ai:sessions.delete')}
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

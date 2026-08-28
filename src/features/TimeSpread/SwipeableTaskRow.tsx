import { useRef, useState } from 'react';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Check, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Reanimated from 'react-native-reanimated';

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
import { useCompletionCelebration } from '@/hooks/useCompletionCelebration';
import { PRIORITY_BORDER_COLOR } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import type { Segment } from './segments';
import { TaskRow } from './TaskRow';

// Swipe right completes; swipe left asks for delete confirmation via
// AlertDialog before firing onDelete — a destructive action must never fire
// straight off the gesture (see the memory: swipe-to-delete always needs a
// confirm, no exceptions). TaskRow's own 3-dot menu delete item routes
// through this same alert (its onDelete prop just opens it, doesn't call the
// real onDelete directly) so both paths share one confirm step.
export function SwipeableTaskRow({
  task,
  segment,
  onToggleStatus,
  onEdit,
  onScheduleToday,
  onScheduleTomorrow,
  onUnschedule,
  onDelete,
}: {
  task: ITask;
  segment: Segment;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onScheduleToday: (task: ITask) => void;
  onScheduleTomorrow: (task: ITask) => void;
  onUnschedule: (task: ITask) => void;
  onDelete: (task: ITask) => void;
}) {
  const { t } = useTranslation(['task', 'common']);
  const swipeableRef = useRef<SwipeableRowHandle>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  // Completing holds the row visible with a celebration before onToggleStatus
  // actually fires; un-completing (or any non-DONE transition) is instant.
  const {
    trigger: celebrateComplete,
    celebrationStyle,
    flashStyle,
  } = useCompletionCelebration(() => {
    onToggleStatus(task);
  });

  const handleToggle = () => {
    if (task.status === TaskStatus.DONE) {
      onToggleStatus(task);
      return;
    }
    celebrateComplete();
  };

  const openDeleteConfirm = () => {
    setPendingDelete(true);
    alertRef.current?.present();
  };

  return (
    <Reanimated.View style={celebrationStyle}>
      <SwipeableRow
        ref={swipeableRef}
        className={cn(
          'rounded-xl border-s-4 border border-border dark:border-border-dark shadow-sm',
          PRIORITY_BORDER_COLOR[task.priority]
        )}
        left={{
          tone: 'success',
          icon: <Check size={20} color="#ffffff" />,
          onPress: handleToggle,
          onOpen: handleToggle,
        }}
        right={{
          tone: 'destructive',
          icon: <Trash2 size={20} color="#ffffff" />,
          // Both tap-the-panel and full-swipe-open only ever OPEN the confirm
          // — neither calls onDelete directly. Destructive swipe actions
          // always confirm, no exceptions.
          onPress: openDeleteConfirm,
          onOpen: openDeleteConfirm,
        }}
      >
        <TaskRow
          task={task}
          segment={segment}
          onToggleStatus={handleToggle}
          onEdit={onEdit}
          onScheduleToday={onScheduleToday}
          onScheduleTomorrow={onScheduleTomorrow}
          onUnschedule={onUnschedule}
          onDelete={openDeleteConfirm}
        />
        <Reanimated.View
          pointerEvents="none"
          style={[{ position: 'absolute', inset: 0, borderRadius: 12, backgroundColor: '#22c55e' }, flashStyle]}
        />
      </SwipeableRow>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('task:deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('task:deleteDialog.description', { name: task.title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) onDelete(task);
              setPendingDelete(false);
              alertRef.current?.dismiss();
              swipeableRef.current?.close();
            }}
          >
            {t('common:actions.delete')}
          </AlertDialogAction>
          <AlertDialogCancel
            onPress={() => {
              setPendingDelete(false);
              alertRef.current?.dismiss();
              swipeableRef.current?.close();
            }}
          >
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </Reanimated.View>
  );
}

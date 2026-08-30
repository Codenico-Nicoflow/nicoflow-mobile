import { useRef, useState } from 'react';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Check, SkipForward, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Reanimated from 'react-native-reanimated';

import { EndSeriesDialog, SkipOccurrenceDialog } from '@/components/recurrence/RecurrenceConfirmDialogs';
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

// Swipe right completes; swipe left opens:
//   - non-recurring tasks: delete confirmation (AlertDialog)
//   - recurring tasks: skip-occurrence confirmation (SkipOccurrenceDialog)
// A destructive action must never fire straight off the gesture — both paths
// ask for confirmation first (see memory: swipe-to-delete always needs a
// confirm, no exceptions).
export function SwipeableTaskRow({
  task,
  segment,
  onToggleStatus,
  onEdit,
  onScheduleToday,
  onScheduleTomorrow,
  onUnschedule,
  onDelete,
  onSkip,
  onEndSeries,
}: {
  task: ITask;
  segment: Segment;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onScheduleToday: (task: ITask) => void;
  onScheduleTomorrow: (task: ITask) => void;
  onUnschedule: (task: ITask) => void;
  onDelete: (task: ITask) => void;
  onSkip: (task: ITask) => void;
  onEndSeries: (task: ITask) => void;
}) {
  const { t } = useTranslation(['task', 'common']);
  const isRecurring = !!task.recurrenceRuleId;
  const swipeableRef = useRef<SwipeableRowHandle>(null);
  const deleteAlertRef = useRef<AlertDialogRef>(null);
  const skipAlertRef = useRef<AlertDialogRef>(null);
  const endSeriesAlertRef = useRef<AlertDialogRef>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingSkip, setPendingSkip] = useState(false);
  const [pendingEndSeries, setPendingEndSeries] = useState(false);

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
    deleteAlertRef.current?.present();
  };

  const openSkipConfirm = () => {
    setPendingSkip(true);
    skipAlertRef.current?.present();
  };

  const openEndSeriesConfirm = () => {
    setPendingEndSeries(true);
    endSeriesAlertRef.current?.present();
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
          icon: isRecurring ? <SkipForward size={20} color="#ffffff" /> : <Trash2 size={20} color="#ffffff" />,
          onPress: isRecurring ? openSkipConfirm : openDeleteConfirm,
          onOpen: isRecurring ? openSkipConfirm : openDeleteConfirm,
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
          onDelete={isRecurring ? openSkipConfirm : openDeleteConfirm}
          onSkip={openSkipConfirm}
          onEndSeries={openEndSeriesConfirm}
        />
        <Reanimated.View
          pointerEvents="none"
          style={[{ position: 'absolute', inset: 0, borderRadius: 12, backgroundColor: '#22c55e' }, flashStyle]}
        />
      </SwipeableRow>

      {/* Non-recurring delete confirm */}
      <AlertDialog ref={deleteAlertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('task:deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('task:deleteDialog.description', { name: task.title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) onDelete(task);
              setPendingDelete(false);
              deleteAlertRef.current?.dismiss();
              swipeableRef.current?.close();
            }}
          >
            {t('common:actions.delete')}
          </AlertDialogAction>
          <AlertDialogCancel
            onPress={() => {
              setPendingDelete(false);
              deleteAlertRef.current?.dismiss();
              swipeableRef.current?.close();
            }}
          >
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>

      {/* Skip occurrence confirm */}
      <SkipOccurrenceDialog
        ref={skipAlertRef}
        onConfirm={() => {
          if (pendingSkip) onSkip(task);
          setPendingSkip(false);
          skipAlertRef.current?.dismiss();
          swipeableRef.current?.close();
        }}
        onCancel={() => {
          setPendingSkip(false);
          skipAlertRef.current?.dismiss();
          swipeableRef.current?.close();
        }}
      />

      {/* End series confirm */}
      <EndSeriesDialog
        ref={endSeriesAlertRef}
        onConfirm={() => {
          if (pendingEndSeries) onEndSeries(task);
          setPendingEndSeries(false);
          endSeriesAlertRef.current?.dismiss();
        }}
        onCancel={() => {
          setPendingEndSeries(false);
          endSeriesAlertRef.current?.dismiss();
        }}
      />
    </Reanimated.View>
  );
}

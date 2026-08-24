import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Ban, CalendarX, MoreVertical, Pencil, Trash2 } from 'lucide-react-native';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { PRIORITY_BORDER_COLOR } from '@/lib/constants/priority';
import { useDeleteTaskMutation, useMarkTaskMissedMutation, useUpdateTaskStatusMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';
import { cn } from '@/lib/utils/cn';

import { TaskChips } from '../../TimeSpread/TaskChips';

const todayISO = () => new Date().toISOString().slice(0, 10);

interface TaskListItemProps {
  task: ITask;
  onEdit: (task: ITask) => void;
  onToggleStatus: (task: ITask) => void;
}

// Mirrors web's TaskItem.tsx: whole row taps to edit, checkbox flips
// active<->done (completion guard for open subtasks lives in TasksSection,
// shared across all rows), 3-dot menu Edit/Cancel/Mark-Missed(conditional)/
// Delete, delete via a confirm dialog matching web's exact copy.
export function TaskListItem({ task, onEdit, onToggleStatus }: TaskListItemProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const isDone = task.status === TaskStatus.DONE;
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [markTaskMissed] = useMarkTaskMissedMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);

  // Mirrors the backend's own mark-missed guard (today-or-past, active,
  // recurring, unreaped) so the menu doesn't offer an action the server
  // would reject.
  const canMarkMissed =
    task.status === TaskStatus.ACTIVE &&
    !!task.recurrenceRuleId &&
    !task.occurrenceStatus &&
    !!task.occurrenceDate &&
    task.occurrenceDate <= todayISO();

  const onCancel = () => {
    void updateTaskStatus({ id: task.id, status: TaskStatus.CANCELLED });
  };

  const onMarkMissed = () => {
    void markTaskMissed({ id: task.id });
  };

  const onConfirmDelete = async () => {
    try {
      await deleteTask(task.id).unwrap();
      showSuccessToast(ToastMessages.TASK_DELETED_SUCCESSFULLY, toast);
    } catch {
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onConfirmDelete();
        },
      });
      return;
    }
    alertRef.current?.dismiss();
  };

  return (
    <View className="flex-row items-start">
      <Pressable
        onPress={() => onEdit(task)}
        accessibilityRole="button"
        testID={`task-item-${task.id}`}
        className={cn(
          'flex-1 flex-row items-start gap-3 rounded-xl border-s-4 border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3 shadow-sm',
          PRIORITY_BORDER_COLOR[task.priority]
        )}
      >
        <View className={cn('flex-1 min-w-0 gap-1.5', isDone && 'opacity-60')}>
          <Text
            className={cn(
              'text-sm font-medium text-foreground dark:text-foreground-dark',
              isDone && 'line-through text-muted-foreground dark:text-muted-foreground-dark'
            )}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {!!task.notes && (
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
              {task.notes}
            </Text>
          )}

          <TaskChips task={task} />
        </View>

        <View className="flex-row items-center gap-1">
          <DropdownMenu
            ref={menuRef}
            trigger={
              <View accessibilityLabel={t('actions.menuLabel')} className="p-1">
                <MoreVertical size={16} color={mutedColor} />
              </View>
            }
          >
            <DropdownMenuItem
              icon={<Pencil size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onEdit(task);
              }}
            >
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Ban size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onCancel();
              }}
            >
              {t('actions.cancel')}
            </DropdownMenuItem>
            {canMarkMissed && (
              <DropdownMenuItem
                icon={<CalendarX size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
                onPress={() => {
                  menuRef.current?.dismiss();
                  onMarkMissed();
                }}
              >
                {t('actions.markMissed')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              icon={<Trash2 size={16} color={isDark ? '#f87171' : '#ef4444'} />}
              variant="destructive"
              onPress={() => {
                menuRef.current?.dismiss();
                alertRef.current?.present();
              }}
            >
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenu>

          <Checkbox checked={isDone} onCheckedChange={() => onToggleStatus(task)} />
        </View>
      </Pressable>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description', { name: task.title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => void onConfirmDelete()}>
            {isDeleting ? `${t('deleteDialog.confirmLabel')}...` : t('deleteDialog.confirmLabel')}
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  );
}

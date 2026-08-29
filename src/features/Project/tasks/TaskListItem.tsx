import { useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Ban, CalendarX, Check, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react-native';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { SwipeableRow, type SwipeableRowHandle } from '@/components/ui/swipeable-row';
import { toast } from '@/components/ui/toast';
import { useCompletionCelebration } from '@/hooks/useCompletionCelebration';
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
  dragHandleProps?: { onLongPress?: () => void; disabled?: boolean };
}

// Mirrors web's TaskItem.tsx: whole row taps to edit, checkbox flips
// active<->done (completion guard for open subtasks lives in TasksSection,
// shared across all rows), 3-dot menu Edit/Cancel/Mark-Missed(conditional)/
// Delete, delete via a confirm dialog matching web's exact copy.
//
// Layout/spacing here is deliberately inline `style`, not className `gap-*`:
// this NativeWind build (v5 preview + react-native-css) silently drops `gap`
// utilities on some nested Views, which starves Text children of an
// intrinsic height (a Text with no resolvable line box renders zero pixels
// tall — confirmed on-device: title text was invisible until every
// className-based gap/spacing on its ancestor chain was replaced with
// inline style). Colors/borders/radius via className still work fine — only
// gap is affected — so only spacing moved to inline style here, not the
// whole file.
export function TaskListItem({ task, onEdit, onToggleStatus, dragHandleProps }: TaskListItemProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const isDone = task.status === TaskStatus.DONE;
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [markTaskMissed] = useMarkTaskMissedMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const swipeRef = useRef<SwipeableRowHandle>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  // Completing holds the row visible with a celebration before the parent's
  // onToggleStatus (which owns the open-subtask completion guard) actually
  // fires; un-completing is instant, no hold — mirrors web's one-directional
  // completion guard.
  const {
    trigger: celebrateComplete,
    celebrationStyle,
    flashStyle,
  } = useCompletionCelebration(() => {
    onToggleStatus(task);
  });

  const handleToggle = () => {
    if (isDone) {
      onToggleStatus(task);
      return;
    }
    celebrateComplete();
  };

  const openDeleteConfirm = () => {
    setPendingDelete(true);
    alertRef.current?.present();
  };

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
    setPendingDelete(false);
    alertRef.current?.dismiss();
    swipeRef.current?.close();
  };

  return (
    <Reanimated.View style={celebrationStyle}>
      <SwipeableRow
        ref={swipeRef}
        left={{
          tone: 'success',
          icon: <Check size={20} color="#ffffff" />,
          onPress: handleToggle,
          onOpen: handleToggle,
        }}
        right={{
          tone: 'destructive',
          icon: <Trash2 size={20} color="#ffffff" />,
          onPress: openDeleteConfirm,
          onOpen: openDeleteConfirm,
        }}
      >
        <Pressable
          onPress={() => onEdit(task)}
          accessibilityRole="button"
          testID={`task-item-${task.id}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, minHeight: 56 }}
          className={cn(
            'rounded-xl border-s-4 border border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-sm',
            PRIORITY_BORDER_COLOR[task.priority]
          )}
        >
          <View style={{ flex: 1, minWidth: 0, minHeight: 32, gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                lineHeight: 18,
                minHeight: 18,
                fontWeight: '500',
                color: isDone ? mutedColor : isDark ? '#e2e8f0' : '#0f172a',
                textDecorationLine: isDone ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </Text>

            {!!task.notes && (
              <Text style={{ fontSize: 12, lineHeight: 16, minHeight: 16, color: mutedColor }}>{task.notes}</Text>
            )}

            <TaskChips task={task} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable
              onLongPress={dragHandleProps?.onLongPress}
              disabled={dragHandleProps?.disabled}
              accessibilityLabel="Drag to reorder"
              hitSlop={8}
              className="p-1"
            >
              <GripVertical size={16} color={mutedColor} />
            </Pressable>

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
                  openDeleteConfirm();
                }}
              >
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenu>

            <Checkbox checked={isDone} onCheckedChange={handleToggle} />
          </View>
        </Pressable>

        <Reanimated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              backgroundColor: '#22c55e',
            },
            flashStyle,
          ]}
        />
      </SwipeableRow>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description', { name: task.title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) void onConfirmDelete();
            }}
          >
            {isDeleting ? `${t('deleteDialog.confirmLabel')}...` : t('deleteDialog.confirmLabel')}
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
    </Reanimated.View>
  );
}

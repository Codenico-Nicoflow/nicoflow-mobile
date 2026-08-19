import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Ban, CalendarX, Edit, MoreVertical, Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { PRIORITY_BORDER_COLOR } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import { TaskChips } from './TaskChips';

// Mirrors the backend's own mark-missed guard (today-or-past, active,
// recurring, unreaped) — same rule as web's TaskItem.canMarkMissed — so the
// menu doesn't offer an action the server would reject.
const canMarkMissed = (task: ITask): boolean =>
  task.status === TaskStatus.ACTIVE &&
  !!task.recurrenceRuleId &&
  !task.occurrenceStatus &&
  !!task.occurrenceDate &&
  task.occurrenceDate <= new Date().toISOString().slice(0, 10);

interface TaskRowProps {
  task: ITask;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onCancel: (task: ITask) => void;
  onMarkMissed: (task: ITask) => void;
  onDelete: (task: ITask) => void;
}

export function TaskRow({ task, onToggleStatus, onEdit, onCancel, onMarkMissed, onDelete }: TaskRowProps) {
  const isDone = task.status === TaskStatus.DONE;
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const menuRef = useRef<DropdownMenuRef>(null);

  return (
    <Pressable
      onPress={() => onEdit(task)}
      accessibilityRole="button"
      accessibilityLabel="Edit task"
      testID={`task-row-${task.id}`}
      className={cn(
        'flex-row items-start gap-3 rounded-xl border-s-4 border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3 shadow-sm',
        PRIORITY_BORDER_COLOR[task.priority]
      )}>
      <View className={cn('flex-1 min-w-0 gap-1.5', isDone && 'opacity-60')}>
        <Text
          className={cn(
            'text-sm font-medium text-foreground dark:text-foreground-dark',
            isDone && 'line-through text-muted-foreground dark:text-muted-foreground-dark'
          )}
          numberOfLines={2}>
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
        <Pressable onPress={() => onEdit(task)} accessibilityRole="button" accessibilityLabel="Edit task" className="p-1">
          <Edit size={16} color={mutedColor} />
        </Pressable>

        <DropdownMenu
          ref={menuRef}
          trigger={
            <View accessibilityLabel="Task actions" className="p-1">
              <MoreVertical size={16} color={mutedColor} />
            </View>
          }>
          <DropdownMenuItem
            icon={<Edit size={16} color={mutedColor} />}
            onPress={() => {
              menuRef.current?.dismiss();
              onEdit(task);
            }}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<Ban size={16} color={mutedColor} />}
            onPress={() => {
              menuRef.current?.dismiss();
              onCancel(task);
            }}>
            Cancel
          </DropdownMenuItem>
          {canMarkMissed(task) && (
            <DropdownMenuItem
              icon={<CalendarX size={16} color={mutedColor} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onMarkMissed(task);
              }}>
              Mark missed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            icon={<Trash2 size={16} color={isDark ? '#ef4444' : '#dc2626'} />}
            onPress={() => {
              menuRef.current?.dismiss();
              onDelete(task);
            }}>
            Delete
          </DropdownMenuItem>
        </DropdownMenu>

        <Checkbox checked={isDone} onCheckedChange={() => onToggleStatus(task)} />
      </View>
    </Pressable>
  );
}

import { Pressable, Text, View } from 'react-native';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';

import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_BORDER_COLOR } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import { TaskChips } from '../../TimeSpread/TaskChips';

interface TaskListItemProps {
  task: ITask;
  onEdit: (task: ITask) => void;
  onToggleStatus: (task: ITask) => void;
}

// Mirrors web's TaskItem.tsx for the project task list: whole row taps to
// edit, checkbox flips active<->done. The 3-dot actions menu
// (Edit/Cancel/Mark missed/Delete + open-subtasks completion guard) is
// NIC-1981's scope — this row is the read/toggle surface only.
export function TaskListItem({ task, onEdit, onToggleStatus }: TaskListItemProps) {
  const isDone = task.status === TaskStatus.DONE;

  return (
    <Pressable
      onPress={() => onEdit(task)}
      accessibilityRole="button"
      testID={`task-item-${task.id}`}
      className={cn(
        'flex-row items-start gap-3 rounded-xl border-s-4 border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3 shadow-sm',
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

      <Checkbox checked={isDone} onCheckedChange={() => onToggleStatus(task)} />
    </Pressable>
  );
}

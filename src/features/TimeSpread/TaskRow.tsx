import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { Repeat } from 'lucide-react-native';
import { Text, useColorScheme, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';

const PRIORITY_COLOR: Record<ITask['priority'], string> = {
  low: 'bg-muted-foreground dark:bg-muted-foreground-dark',
  medium: 'bg-primary dark:bg-primary-dark',
  high: 'bg-destructive dark:bg-destructive-dark',
};

interface TaskRowProps {
  task: ITask;
  onToggleStatus: (task: ITask) => void;
}

export function TaskRow({ task, onToggleStatus }: TaskRowProps) {
  const isDone = task.status === TaskStatus.DONE;
  const hasRecurrence = !!task.recurrenceRuleId;
  const mutedColor = useColorScheme() === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <View
      className="flex-row items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3 shadow-sm"
      testID={`task-row-${task.id}`}>
      <View className={cn('size-2 rounded-full', PRIORITY_COLOR[task.priority])} accessibilityLabel={`${task.priority} priority`} />

      <View className="flex-1 min-w-0 gap-1">
        <Text
          className={cn(
            'text-sm font-medium text-foreground dark:text-foreground-dark',
            isDone && 'line-through text-muted-foreground dark:text-muted-foreground-dark'
          )}
          numberOfLines={2}>
          {task.title}
        </Text>
        {(task.scheduledTime || hasRecurrence) && (
          <View className="flex-row items-center gap-2">
            {task.scheduledTime && (
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{task.scheduledTime}</Text>
            )}
            {hasRecurrence && <Repeat size={12} color={mutedColor} />}
          </View>
        )}
      </View>

      <Checkbox checked={isDone} onCheckedChange={() => onToggleStatus(task)} />
    </View>
  );
}

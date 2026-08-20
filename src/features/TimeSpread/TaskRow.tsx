import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { CalendarClock, CalendarX, MoreVertical } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { PRIORITY_BORDER_COLOR } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import type { Segment } from './segments';
import { TaskChips } from './TaskChips';

interface TaskRowProps {
  task: ITask;
  segment: Segment;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onScheduleToday: (task: ITask) => void;
  onScheduleTomorrow: (task: ITask) => void;
  onUnschedule: (task: ITask) => void;
}

// Mirrors web's TimeSpreadRow (nicoflow-frontend/src/features/TimeSpread/components/TimeSpreadRow.tsx):
// the actions menu here is reschedule shortcuts, not the project-view
// Edit/Cancel/Mark-missed/Delete set — this is a scheduling surface, not the
// task's home. Editing other fields happens by tapping the card.
export function TaskRow({
  task,
  segment,
  onToggleStatus,
  onEdit,
  onScheduleToday,
  onScheduleTomorrow,
  onUnschedule,
}: TaskRowProps) {
  const { t } = useTranslation('task');
  const isDone = task.status === TaskStatus.DONE;
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const menuRef = useRef<DropdownMenuRef>(null);

  return (
    <Pressable
      onPress={() => onEdit(task)}
      accessibilityRole="button"
      accessibilityLabel={t('actions.edit')}
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
        <DropdownMenu
          ref={menuRef}
          trigger={
            <View accessibilityLabel={t('actions.menuLabel')} className="p-1">
              <MoreVertical size={16} color={mutedColor} />
            </View>
          }>
          {segment !== 'today' && (
            <DropdownMenuItem
              icon={<CalendarClock size={16} color={mutedColor} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onScheduleToday(task);
              }}>
              {t('timeSpread.actions.today')}
            </DropdownMenuItem>
          )}
          {segment !== 'tomorrow' && (
            <DropdownMenuItem
              icon={<CalendarClock size={16} color={mutedColor} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onScheduleTomorrow(task);
              }}>
              {t('timeSpread.actions.tomorrow')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            icon={<CalendarX size={16} color={mutedColor} />}
            onPress={() => {
              menuRef.current?.dismiss();
              onUnschedule(task);
            }}>
            {t('timeSpread.actions.remove')}
          </DropdownMenuItem>
        </DropdownMenu>

        <Checkbox checked={isDone} onCheckedChange={() => onToggleStatus(task)} />
      </View>
    </Pressable>
  );
}

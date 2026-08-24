import { Text, View } from 'react-native';

import { type ITask } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Separator } from '@/components/ui/separator';

import type { DayGroup } from './segments';
import { SwipeableTaskRow } from './SwipeableTaskRow';

interface Props {
  today: ITask[];
  tomorrow: ITask[];
  weekGroups: DayGroup[];
  dayHeaderFormatter: Intl.DateTimeFormat;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onScheduleToday: (task: ITask) => void;
  onScheduleTomorrow: (task: ITask) => void;
  onUnschedule: (task: ITask) => void;
  onDelete: (task: ITask) => void;
}

// Every section renders even when empty — an empty section reads as "clear",
// while a missing one reads as "did this load?". Mirrors nicoflow-frontend's
// TimeSpreadCombinedView.
export function TimeSpreadCombinedView({
  today,
  tomorrow,
  weekGroups,
  dayHeaderFormatter,
  onToggleStatus,
  onEdit,
  onScheduleToday,
  onScheduleTomorrow,
  onUnschedule,
  onDelete,
}: Props) {
  const { t } = useTranslation('task');

  const renderRow = (task: ITask, segment: 'today' | 'tomorrow' | 'week') => (
    <SwipeableTaskRow
      key={task.id}
      task={task}
      segment={segment}
      onToggleStatus={onToggleStatus}
      onEdit={onEdit}
      onScheduleToday={onScheduleToday}
      onScheduleTomorrow={onScheduleTomorrow}
      onUnschedule={onUnschedule}
      onDelete={onDelete}
    />
  );

  return (
    <View className="gap-6" testID="timespread-combined">
      <View className="gap-3" testID="timespread-section-today">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
          {t('timeSpread.today.title')}
        </Text>
        {today.length > 0 ? (
          <View className="gap-2">{today.map(task => renderRow(task, 'today'))}</View>
        ) : (
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('timeSpread.today.emptyTitle')}
          </Text>
        )}
      </View>

      <Separator />

      <View className="gap-3" testID="timespread-section-tomorrow">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
          {t('timeSpread.tomorrow.title')}
        </Text>
        {tomorrow.length > 0 ? (
          <View className="gap-2">{tomorrow.map(task => renderRow(task, 'tomorrow'))}</View>
        ) : (
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('timeSpread.tomorrow.emptyTitle')}
          </Text>
        )}
      </View>

      <Separator />

      <View className="gap-3" testID="timespread-section-week">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
          {t('timeSpread.week.title')}
        </Text>
        {weekGroups.length > 0 ? (
          <View className="gap-4">
            {weekGroups.map(group => (
              <View key={group.key} testID={`timespread-day-${group.key}`} className="gap-2">
                <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                  {dayHeaderFormatter.format(group.date)}
                </Text>
                <View className="gap-2">{group.tasks.map(task => renderRow(task, 'week'))}</View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('timeSpread.week.emptyTitle')}
          </Text>
        )}
      </View>
    </View>
  );
}

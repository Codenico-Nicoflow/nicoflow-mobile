import { Pressable, ScrollView, Text, View } from 'react-native';

import { ScheduleFilter, type TaskEnergy } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';
import { ENERGY_OPTIONS } from '@/lib/constants/energy';
import { cn } from '@/lib/utils/cn';

import { TASK_FILTER, TASK_FILTER_ORDER, type TaskCounts, type TaskFilter } from './filters';

type ScheduleFilterValue = (typeof ScheduleFilter)[keyof typeof ScheduleFilter];

const SCHEDULE_FILTER_ORDER: { value: ScheduleFilterValue; labelKey: string }[] = [
  { value: ScheduleFilter.ALL, labelKey: 'filters.schedule.all' },
  { value: ScheduleFilter.SCHEDULED, labelKey: 'filters.schedule.scheduled' },
  { value: ScheduleFilter.UNSCHEDULED, labelKey: 'filters.schedule.unscheduled' },
];

interface TaskFiltersProps {
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  activeEnergy: TaskEnergy | 'all';
  onEnergyChange: (energy: TaskEnergy | 'all') => void;
  taskCounts: TaskCounts;
  scheduleFilter: ScheduleFilterValue;
  onScheduleFilterChange: (filter: ScheduleFilterValue) => void;
}

// Mirrors web's TaskFilters.tsx: status segmented control (dimmed+disabled at
// zero count), energy dropdown, schedule chips (Active tab only).
export function TaskFilters({
  activeFilter,
  onFilterChange,
  activeEnergy,
  onEnergyChange,
  taskCounts,
  scheduleFilter,
  onScheduleFilterChange,
}: TaskFiltersProps) {
  const { t } = useTranslation(['task', 'common']);
  const energyOptions = [
    { value: 'all', label: t('task:filters.energyAll') },
    ...ENERGY_OPTIONS.map(o => ({ value: o.value, label: o.label })),
  ];

  return (
    <View className="gap-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          className="flex-row items-center gap-1 rounded-lg bg-muted dark:bg-muted-dark p-1"
          accessibilityRole="tablist"
          accessibilityLabel={t('task:filters.all')}
        >
          {TASK_FILTER_ORDER.map(filter => {
            const isActive = activeFilter === filter.value;
            const count = taskCounts[filter.countKey];
            const isEmpty = count === 0 && !isActive;
            return (
              <Pressable
                key={filter.value}
                onPress={() => !isEmpty && onFilterChange(filter.value)}
                disabled={isEmpty}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive, disabled: isEmpty }}
                testID={`task-filter-${filter.value}`}
                className={cn(
                  'flex-row items-center gap-1.5 rounded-md px-3 py-1.5',
                  isActive && 'bg-background dark:bg-background-dark shadow-sm',
                  isEmpty && 'opacity-40'
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    isActive
                      ? 'text-foreground dark:text-foreground-dark'
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  )}
                >
                  {t(`task:filters.${filter.countKey}`)}
                </Text>
                <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{count}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Select value={activeEnergy} onValueChange={v => onEnergyChange(v as TaskEnergy | 'all')} options={energyOptions}>
        <SelectTrigger placeholder={t('task:filters.energyAll')} className="w-40 self-start" />
      </Select>

      {activeFilter === TASK_FILTER.ACTIVE && (
        <View
          className="flex-row items-center gap-1 self-start rounded-lg bg-muted dark:bg-muted-dark p-1"
          accessibilityRole="tablist"
          accessibilityLabel={t('task:filters.scheduleLabel')}
        >
          {SCHEDULE_FILTER_ORDER.map(({ value, labelKey }) => {
            const isActive = scheduleFilter === value;
            return (
              <Pressable
                key={value}
                onPress={() => onScheduleFilterChange(value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                testID={`task-schedule-filter-${value}`}
                className={cn('rounded-md px-3 py-1', isActive && 'bg-background dark:bg-background-dark shadow-sm')}
              >
                <Text
                  className={cn(
                    'text-xs font-medium',
                    isActive
                      ? 'text-foreground dark:text-foreground-dark'
                      : 'text-muted-foreground dark:text-muted-foreground-dark'
                  )}
                >
                  {t(`task:${labelKey}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

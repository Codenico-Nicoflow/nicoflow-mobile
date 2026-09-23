import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { CalendarX, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';

export interface CalendarDaySheetRef {
  present: (dayKey: string) => void;
  dismiss: () => void;
}

interface CalendarDaySheetProps {
  tasksByDay: ReadonlyMap<string, readonly ITask[]>;
  locale: string;
  onSelectedDayChange: (dayKey: string) => void;
}

export const CalendarDaySheet = forwardRef<CalendarDaySheetRef, CalendarDaySheetProps>(function CalendarDaySheet(
  { tasksByDay, locale, onSelectedDayChange },
  ref
) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const sheetRef = useRef<SheetRef>(null);
  const [dayKey, setDayKey] = useState('');
  const tasks = tasksByDay.get(dayKey) ?? [];
  const dateLabel = dayKey
    ? new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(`${dayKey}T12:00:00`)
      )
    : '';

  useImperativeHandle(ref, () => ({
    present: nextDayKey => {
      setDayKey(nextDayKey);
      onSelectedDayChange(nextDayKey);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const openTask = (taskId: string): void => {
    sheetRef.current?.dismiss();
    router.push(`/task/${taskId}`);
  };

  return (
    <Sheet ref={sheetRef} snapPoints={['65%']}>
      <SheetHeader>
        <SheetTitle>{dateLabel}</SheetTitle>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {t('pages.calendar.dayTaskCount', { count: tasks.length })}
        </Text>
      </SheetHeader>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={t('pages.calendar.emptyDayTitle')}
          description={t('pages.calendar.emptyDayDescription')}
          testID="calendar-day-empty"
        />
      ) : (
        <View className="gap-2" testID="calendar-day-task-list">
          {tasks.map(task => (
            <Pressable
              key={task.id}
              onPress={() => openTask(task.id)}
              accessibilityRole="button"
              accessibilityLabel={t('pages.calendar.openTask', { title: task.title })}
              className="min-h-12 flex-row items-center gap-3 rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark px-3 py-2"
              testID={`calendar-day-task-${task.id}`}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">{task.title}</Text>
                {task.scheduledTime ? (
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                    {task.scheduledTime}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={16} color={colors.textSecondary} accessibilityElementsHidden />
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
});

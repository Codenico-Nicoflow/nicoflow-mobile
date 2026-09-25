import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { CalendarX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';

import { CalendarDayTaskCard } from './CalendarDayTaskCard';

export interface CalendarDaySheetRef {
  present: (dayKey: string) => void;
  dismiss: () => void;
}

interface CalendarDaySheetProps {
  tasksByDay: ReadonlyMap<string, readonly ITask[]>;
  locale: string;
  onSelectedDayChange: (dayKey: string) => void;
  pendingTaskIds: ReadonlySet<string>;
}

export const CalendarDaySheet = forwardRef<CalendarDaySheetRef, CalendarDaySheetProps>(function CalendarDaySheet(
  { tasksByDay, locale, onSelectedDayChange, pendingTaskIds },
  ref
) {
  const { t } = useTranslation('common');
  const sheetRef = useRef<SheetRef>(null);
  const [dayKey, setDayKey] = useState('');
  const tasks = tasksByDay.get(dayKey) ?? [];
  const dateLabel = dayKey
    ? new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(`${dayKey}T12:00:00`)
      )
      : '';

  const openTask = (taskId: string): void => {
    sheetRef.current?.dismiss();
    router.push(`/task/${taskId}`);
  };

  useImperativeHandle(ref, () => ({
    present: nextDayKey => {
      setDayKey(nextDayKey);
      onSelectedDayChange(nextDayKey);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

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
            <CalendarDayTaskCard
              key={task.id}
              task={task}
              dayKey={dayKey}
              locale={locale}
              pending={pendingTaskIds.has(task.id)}
              onOpenTask={openTask}
            />
          ))}
        </View>
      )}
    </Sheet>
  );
});

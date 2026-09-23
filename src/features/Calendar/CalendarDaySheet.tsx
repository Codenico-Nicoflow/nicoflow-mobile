import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { CalendarX, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';

import { isLiveRecurringOccurrence } from './calendarMove';

export interface CalendarDaySheetRef {
  present: (dayKey: string) => void;
  dismiss: () => void;
}

interface CalendarDaySheetProps {
  tasksByDay: ReadonlyMap<string, readonly ITask[]>;
  locale: string;
  onSelectedDayChange: (dayKey: string) => void;
  onMoveTask: (task: ITask, dayKey: string) => Promise<void>;
  pendingTaskId: string | null;
}

export const CalendarDaySheet = forwardRef<CalendarDaySheetRef, CalendarDaySheetProps>(function CalendarDaySheet(
  { tasksByDay, locale, onSelectedDayChange, onMoveTask, pendingTaskId },
  ref
) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const sheetRef = useRef<SheetRef>(null);
  const [dayKey, setDayKey] = useState('');
  const [movingTask, setMovingTask] = useState<ITask | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveError, setMoveError] = useState(false);
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

  const startMove = (task: ITask): void => {
    setMovingTask(task);
    setMoveDate(task.scheduledFor ?? dayKey);
    setMoveError(false);
  };

  const saveMove = async (): Promise<void> => {
    if (!movingTask || !/^\d{4}-\d{2}-\d{2}$/.test(moveDate)) {
      setMoveError(true);
      return;
    }
    await onMoveTask(movingTask, moveDate);
    setMovingTask(null);
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
          {tasks.map(task => {
            const recurringLocked = isLiveRecurringOccurrence(task);
            return (
              <View
                key={task.id}
                className="min-h-12 flex-row items-center gap-3 rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark px-3 py-2"
                testID={`calendar-day-task-${task.id}`}
              >
                <Pressable
                  onPress={() => openTask(task.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('pages.calendar.openTask', { title: task.title })}
                  className="flex-1 flex-row items-center gap-2"
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
                <Pressable
                  onPress={() => startMove(task)}
                  accessibilityRole="button"
                  accessibilityLabel={t('pages.calendar.moveTask', { title: task.title })}
                  disabled={pendingTaskId === task.id || recurringLocked}
                  className="rounded-md border border-border dark:border-border-dark px-2 py-1"
                >
                  <Text className="text-xs font-medium text-primary">{t('pages.calendar.move')}</Text>
                </Pressable>
                {recurringLocked ? <Text className="sr-only">{t('pages.calendar.recurringMoveLocked')}</Text> : null}
              </View>
            );
          })}
        </View>
      )}

      {movingTask ? (
        <View className="mt-4 gap-2 rounded-md border border-border dark:border-border-dark p-3">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('pages.calendar.moveTask', { title: movingTask.title })}
          </Text>
          <TextInput
            value={moveDate}
            onChangeText={value => {
              setMoveDate(value);
              setMoveError(false);
            }}
            accessibilityLabel={t('pages.calendar.moveDateLabel')}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            className="h-9 rounded-md border border-input dark:border-input-dark px-3 text-foreground dark:text-foreground-dark"
            testID="calendar-move-date-input"
          />
          {moveError ? <Text className="text-xs text-destructive">{t('pages.calendar.invalidMoveDate')}</Text> : null}
          <View className="flex-row justify-end gap-2">
            <Pressable onPress={() => setMovingTask(null)} accessibilityRole="button" className="px-3 py-2">
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {t('actions.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void saveMove()}
              accessibilityRole="button"
              disabled={pendingTaskId === movingTask.id}
              className="rounded-md bg-primary px-3 py-2"
              testID="calendar-move-save"
            >
              <Text className="text-sm font-semibold text-primary-foreground">{t('actions.save')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Sheet>
  );
});

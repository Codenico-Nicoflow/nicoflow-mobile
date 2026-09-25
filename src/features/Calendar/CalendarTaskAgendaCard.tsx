import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Radius, Shadows } from '@/constants/theme';

import { CalendarDurationEditor } from './CalendarDurationEditor';
import { isLiveRecurringOccurrence } from './calendarMove';
import { CalendarScheduleEditor } from './CalendarScheduleEditor';

interface CalendarTaskAgendaCardProps {
  task: ITask;
  pending: boolean;
  onSaveSchedule: (
    task: ITask,
    scheduledFor: string,
    scheduledTime: string | null,
    estimatedMinutes: number | null
  ) => Promise<void>;
  onSaveDuration: (task: ITask, minutes: number) => Promise<void>;
}

export function CalendarTaskAgendaCard({ task, pending, onSaveSchedule, onSaveDuration }: CalendarTaskAgendaCardProps) {
  const { t } = useTranslation('common');
  const [editor, setEditor] = useState<'schedule' | 'duration' | 'date' | null>(null);
  const recurringLocked = isLiveRecurringOccurrence(task);

  return (
    <View
      className="mb-2 rounded-lg border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3"
      style={[{ borderRadius: Radius.lg }, Shadows.sm]}
      testID={`calendar-agenda-task-${task.id}`}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Pressable
          onPress={() => router.push(`/task/${task.id}`)}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.openTask', { title: task.title })}
          className="flex-1"
        >
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{task.title}</Text>
          <Text className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {task.scheduledTime ?? t('pages.calendar.untimedTask')} ·{' '}
            {task.estimatedMinutes == null
              ? t('pages.calendar.allDay')
              : t('pages.calendar.durationMinutesValue', { count: task.estimatedMinutes })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setEditor('date')}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.moveTask', { title: task.title })}
          disabled={pending || recurringLocked}
          className="rounded-md border border-border dark:border-border-dark px-2 py-1"
          testID={`calendar-agenda-move-${task.id}`}
        >
          <Text className="text-xs font-medium text-primary">{t('pages.calendar.move')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setEditor('schedule')}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.editSchedule', { title: task.title })}
          disabled={pending}
          className="rounded-md border border-border dark:border-border-dark px-2 py-1"
        >
          <Text className="text-xs font-medium text-primary">{t('actions.edit')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setEditor('duration')}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.editDuration', { title: task.title })}
          disabled={pending}
          className="rounded-md border border-border dark:border-border-dark px-2 py-1"
        >
          <Text className="text-xs font-medium text-primary">{t('pages.calendar.duration')}</Text>
        </Pressable>
      </View>
      {pending ? (
        <Text className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {t('pages.calendar.saving')}
        </Text>
      ) : null}
      {editor === 'date' ? (
        <CalendarScheduleEditor
          task={task}
          pending={pending}
          mode="date"
          onCancel={() => setEditor(null)}
          onSave={async (nextTask, scheduledFor) => {
            await onSaveSchedule(
              nextTask,
              scheduledFor,
              nextTask.scheduledTime ?? null,
              nextTask.estimatedMinutes ?? null
            );
            setEditor(null);
          }}
        />
      ) : null}
      {editor === 'schedule' ? (
        <CalendarScheduleEditor
          task={task}
          pending={pending}
          onCancel={() => setEditor(null)}
          onSave={async (...args) => {
            await onSaveSchedule(...args);
            setEditor(null);
          }}
        />
      ) : null}
      {editor === 'duration' ? (
        <CalendarDurationEditor
          task={task}
          pending={pending}
          onCancel={() => setEditor(null)}
          onSave={async (nextTask, minutes) => {
            await onSaveDuration(nextTask, minutes);
            setEditor(null);
          }}
        />
      ) : null}
    </View>
  );
}

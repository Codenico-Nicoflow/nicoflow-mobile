import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { ITask } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

interface CalendarScheduleEditorProps {
  task: ITask;
  pending: boolean;
  mode?: 'schedule' | 'date';
  onSave: (
    task: ITask,
    scheduledFor: string,
    scheduledTime: string | null,
    estimatedMinutes: number | null
  ) => Promise<void>;
  onCancel: () => void;
}

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12);
  return date.getFullYear() === year && date.getMonth() === (month ?? 1) - 1 && date.getDate() === day;
};

const isValidTime = (value: string): boolean => value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const isValidDuration = (value: string): boolean =>
  value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1440);

export function CalendarScheduleEditor({
  task,
  pending,
  mode = 'schedule',
  onSave,
  onCancel,
}: CalendarScheduleEditorProps) {
  const { t } = useTranslation('common');
  const [scheduledFor, setScheduledFor] = useState(task.scheduledFor ?? '');
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimatedMinutes == null ? '' : String(task.estimatedMinutes)
  );
  const [invalid, setInvalid] = useState(false);

  const save = (): void => {
    if (!isValidDate(scheduledFor) || !isValidTime(scheduledTime) || !isValidDuration(estimatedMinutes)) {
      setInvalid(true);
      return;
    }
    void onSave(task, scheduledFor, scheduledTime || null, estimatedMinutes ? Number(estimatedMinutes) : null);
  };

  return (
    <View
      className="mt-4 gap-3 rounded-md border border-border dark:border-border-dark p-3"
      testID="calendar-schedule-editor"
    >
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {t('pages.calendar.editSchedule', { title: task.title })}
      </Text>
      <TextInput
        value={scheduledFor}
        onChangeText={setScheduledFor}
        accessibilityLabel={t('pages.calendar.scheduleDateLabel')}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        className="h-9 rounded-md border border-input dark:border-input-dark px-3 text-foreground dark:text-foreground-dark"
        testID="calendar-schedule-date-input"
      />
      {mode === 'schedule' ? (
        <>
          <TextInput
            value={scheduledTime}
            onChangeText={setScheduledTime}
            accessibilityLabel={t('pages.calendar.scheduleTimeLabel')}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
            className="h-9 rounded-md border border-input dark:border-input-dark px-3 text-foreground dark:text-foreground-dark"
            testID="calendar-schedule-time-input"
          />
          <TextInput
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            accessibilityLabel={t('pages.calendar.durationMinutes')}
            keyboardType="number-pad"
            className="h-9 rounded-md border border-input dark:border-input-dark px-3 text-foreground dark:text-foreground-dark"
            testID="calendar-schedule-duration-input"
          />
        </>
      ) : null}
      {invalid ? (
        <Text className="text-xs text-destructive" accessibilityRole="alert" testID="calendar-schedule-error">
          {t('pages.calendar.invalidSchedule')}
        </Text>
      ) : null}
      <View className="flex-row justify-end gap-2">
        <Pressable onPress={onCancel} accessibilityRole="button" className="px-3 py-2">
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{t('actions.cancel')}</Text>
        </Pressable>
        <Pressable
          onPress={save}
          accessibilityRole="button"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2"
          testID="calendar-schedule-save"
        >
          <Text className="text-sm font-semibold text-primary-foreground">{t('actions.save')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

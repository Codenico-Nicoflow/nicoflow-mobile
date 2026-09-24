import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { ITask } from '@nicoflow/shared/types';
import { GripHorizontal } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/hooks/use-theme';

import { clampDuration, DURATION_SUGGESTION, parseDurationInput, resizeDuration } from './calendarDuration';

interface CalendarDurationEditorProps {
  task: ITask;
  pending: boolean;
  onSave: (task: ITask, minutes: number) => Promise<void>;
  onCancel: () => void;
}

export function CalendarDurationEditor({ task, pending, onSave, onCancel }: CalendarDurationEditorProps) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const initial = task.estimatedMinutes ?? DURATION_SUGGESTION;
  const [preview, setPreview] = useState(() => clampDuration(initial, task.scheduledTime));
  const [input, setInput] = useState(String(initial));
  const [invalid, setInvalid] = useState(false);

  const drag = Gesture.Pan()
    .enabled(Boolean(task.scheduledTime) && !pending)
    .runOnJS(true)
    .onUpdate(event => setPreview(resizeDuration(initial, event.translationY, task.scheduledTime)))
    .onEnd((event, success) => {
      if (!success) return;
      void onSave(task, resizeDuration(initial, event.translationY, task.scheduledTime));
    });

  const saveInput = (): void => {
    const parsed = parseDurationInput(input);
    if (parsed === null) {
      setInvalid(true);
      return;
    }
    const clamped = clampDuration(parsed, task.scheduledTime);
    setPreview(clamped);
    void onSave(task, clamped);
  };

  const adjustDuration = (direction: 'increment' | 'decrement'): void => {
    const delta = direction === 'increment' ? 15 : -15;
    const next = clampDuration(preview + delta, task.scheduledTime);
    setPreview(next);
    setInput(String(next));
  };

  return (
    <View className="mt-4 gap-3 rounded-md border border-border dark:border-border-dark p-3" testID="duration-editor">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{task.title}</Text>
      {task.estimatedMinutes == null ? (
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {t('pages.calendar.durationSuggestion', { count: DURATION_SUGGESTION })}
        </Text>
      ) : null}
      {task.scheduledTime ? (
        <View className="rounded-md bg-primary/5 p-3">
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            {t('pages.calendar.durationPreview', { start: task.scheduledTime, count: preview })}
          </Text>
          <GestureDetector gesture={drag}>
            <View
              className="mt-3 h-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10"
              accessibilityRole="adjustable"
              accessibilityLabel={t('pages.calendar.resizeDuration')}
              accessibilityValue={{ min: 1, max: 1440, now: preview, text: `${preview}` }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={event => {
                if (event.nativeEvent.actionName === 'increment' || event.nativeEvent.actionName === 'decrement') {
                  adjustDuration(event.nativeEvent.actionName);
                }
              }}
              testID="calendar-duration-handle"
            >
              <GripHorizontal size={22} color={colors.primary} />
            </View>
          </GestureDetector>
        </View>
      ) : null}
      <TextInput
        value={input}
        onChangeText={value => {
          setInput(value);
          setInvalid(false);
        }}
        keyboardType="number-pad"
        accessibilityLabel={t('pages.calendar.durationMinutes')}
        className="h-9 rounded-md border border-input dark:border-input-dark px-3 text-foreground dark:text-foreground-dark"
        testID="calendar-duration-input"
      />
      {invalid ? <Text className="text-xs text-destructive">{t('pages.calendar.invalidDuration')}</Text> : null}
      <View className="flex-row justify-end gap-2">
        <Pressable onPress={onCancel} accessibilityRole="button" className="px-3 py-2">
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{t('actions.cancel')}</Text>
        </Pressable>
        <Pressable
          onPress={saveInput}
          accessibilityRole="button"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2"
          testID="calendar-duration-save"
        >
          <Text className="text-sm font-semibold text-primary-foreground">{t('actions.save')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

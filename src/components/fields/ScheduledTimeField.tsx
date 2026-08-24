import { AlarmClock, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, useColorScheme, View } from 'react-native';

import { FieldLabel } from './FieldLabel';

const TIME_STEP_MINUTES = 15;

// Rounds "HH:MM" to the nearest 15-minute boundary, clamped inside the day —
// same rule as web's ScheduledTimeField.snapTimeString (not exported from
// @nicoflow/shared, so duplicated here). Typed input can land on 09:07; the
// backend only accepts quarter hours, so the field settles on blur instead of
// failing validation for a value the user can't see is wrong.
const snapTimeString = (value: string): string => {
  const [hours = NaN, minutes = NaN] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const total = Math.min(
    Math.round((hours * 60 + minutes) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES,
    24 * 60 - TIME_STEP_MINUTES
  );
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const isValidTime = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);

interface ScheduledTimeFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** A time without a day has nowhere to land — disable until a date is set. */
  disabled?: boolean;
}

// Plain text entry, deliberately not a native time-picker dependency — same
// reasoning as RecurrenceField's InlineDateField: this repo has no
// datetimepicker package, and adding a native modal here risks the same
// modal-stacking crash that pushed RecurrenceField's date fields to text.
export function ScheduledTimeField({ value, onChange, disabled }: ScheduledTimeFieldProps) {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value ?? '');

  return (
    <View className="gap-1.5">
      <FieldLabel icon={AlarmClock} label={t('fields.scheduledTimeLabel')} optional />
      <View className="flex-row gap-2">
        <TextInput
          value={text}
          onChangeText={setDraft}
          onBlur={() => {
            if (draft != null) {
              onChange(draft && isValidTime(draft) ? snapTimeString(draft) : null);
            }
            setDraft(null);
          }}
          editable={!disabled}
          placeholder="HH:MM"
          keyboardType="number-pad"
          maxLength={5}
          placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          className="h-10 flex-1 rounded-md border border-input dark:border-input-dark px-3 text-sm text-foreground dark:text-foreground-dark bg-background dark:bg-background-dark disabled:opacity-50"
        />
        {!!value && !disabled && (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={t('fields.scheduledTimeClear')}
            className="h-10 w-10 items-center justify-center rounded-md border border-input dark:border-input-dark">
            <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

import {
  MONTHDAY_LAST,
  RECURRENCE_MAX_INTERVAL,
  RECURRENCE_MIN_INTERVAL,
  RECURRENCE_WEEKDAYS,
  RecurrenceEnd,
  RecurrenceFreq,
} from '@nicoflow/shared/types';
import { Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { Select, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';

import { defaultRecurrence, type RecurrenceValue } from './recurrence';
import { useRecurrenceSummary } from './useRecurrenceSummary';

// Displays/accepts DD-MM-YYYY; the value prop/onChange still carry the wire
// format (ISO "YYYY-MM-DD" — what CreateRecurrenceRuleRequest expects), so
// this is purely a display-format translation, not a storage format change.
const isoToDisplay = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}-${m}-${y}` : '';
};

const displayToISO = (display: string): string | null => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(display);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
};

// Plain text entry — deliberately NOT DateField (Sheet+Calendar) here.
// DateField's own Sheet mounting in the same synchronous render as the
// Repeats toggle was a candidate for the native SIGABRT this section used
// to trigger (root-caused to the Switch primitive instead, see the toggle
// button below) — kept as plain text for now since a full recalendar
// picker is a separate follow-up.
function InlineDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const isDark = useColorScheme() === 'dark';
  // Diverges from the value-derived display only while the user is actively
  // typing (draft !== null) — otherwise renders straight from `value`, so no
  // effect is needed to resync when the parent changes it externally (e.g.
  // toggling Repeats off and back on reseeds via defaultRecurrence()).
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? isoToDisplay(value);

  return (
    <TextInput
      value={text}
      onChangeText={setDraft}
      onBlur={() => {
        const iso = draft == null ? null : displayToISO(draft);
        if (iso) onChange(iso);
        setDraft(null);
      }}
      placeholder="DD-MM-YYYY"
      keyboardType="number-pad"
      maxLength={10}
      placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
      className="h-10 rounded-md border border-input dark:border-input-dark px-3 text-sm text-foreground dark:text-foreground-dark bg-background dark:bg-background-dark"
    />
  );
}

// Segmented Pressable row for a small fixed option set — deliberately not
// the Select primitive here. Select opens its own BottomSheetModal, and
// toggling "Repeats" on mounts Frequency + End (both were Selects) + Start's
// DateField (its own Sheet) all in the same synchronous render, inside the
// TaskCreateSheet Sheet that's already open. Registering that many native
// modals into gorhom's stackBehavior="push" queue in one commit crashed the
// app natively (SIGABRT, confirmed via device crash log — not a JS error,
// so neither tsc nor jest caught it). A plain Pressable row has no native
// modal to register, so it doesn't add to that count.
function SegmentedField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <View className="flex-row rounded-md bg-muted dark:bg-muted-dark p-1">
      {options.map(option => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              'flex-1 items-center justify-center rounded px-2 py-1.5',
              active && 'bg-background dark:bg-background-dark shadow-sm'
            )}>
            <Text
              className={cn(
                'text-xs font-medium',
                active ? 'text-foreground dark:text-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
              )}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface RecurrenceFieldProps {
  value: RecurrenceValue | null;
  onChange: (value: RecurrenceValue | null) => void;
}

// Full recurrence editor matching web's RecurrenceField field-for-field
// (frequency, interval, on-days/monthday, start/end date) — the earlier
// mobile picker (a None/Daily/Weekly/Monthly dropdown with no interval or
// weekday control) undersold what a "repeating task" actually configures.
export function RecurrenceField({ value, onChange }: RecurrenceFieldProps) {
  const { t } = useTranslation('recurrence');
  const summarize = useRecurrenceSummary();
  const isDark = useColorScheme() === 'dark';
  const enabled = value !== null;
  const rule = value ?? defaultRecurrence();

  const FREQ_OPTIONS = [
    { label: t('freq.daily'), value: RecurrenceFreq.DAILY },
    { label: t('freq.weekly'), value: RecurrenceFreq.WEEKLY },
    { label: t('freq.monthly'), value: RecurrenceFreq.MONTHLY },
    { label: t('freq.yearly'), value: RecurrenceFreq.YEARLY },
  ];

  const END_OPTIONS = [
    { label: t('field.endNever'), value: RecurrenceEnd.NEVER },
    { label: t('field.endOnDate'), value: RecurrenceEnd.ON_DATE },
  ];

  const MONTHDAY_OPTIONS = [
    ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
    { label: t('field.lastDayOfMonth'), value: String(MONTHDAY_LAST) },
  ];

  const patch = (next: Partial<RecurrenceValue>) => onChange({ ...rule, ...next });

  const toggleWeekday = (day: number) => {
    const has = rule.byWeekday.includes(day);
    patch({ byWeekday: has ? rule.byWeekday.filter(d => d !== day) : [...rule.byWeekday, day].sort((a, b) => a - b) });
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Repeat size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{t('field.label')}</Text>
          </View>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('field.description')}
          </Text>
        </View>
        <Pressable
          onPress={() => onChange(enabled ? null : defaultRecurrence())}
          accessibilityRole="button"
          accessibilityState={{ selected: enabled }}
          className={cn(
            'h-8 min-w-16 items-center justify-center rounded-full border px-3',
            enabled
              ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
              : 'border-input dark:border-input-dark bg-transparent'
          )}>
          <Text
            className={cn(
              'text-xs font-semibold',
              enabled ? 'text-primary-foreground' : 'text-muted-foreground dark:text-muted-foreground-dark'
            )}>
            {enabled ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>

      {enabled && (
        <View className="gap-3 rounded-md border border-border dark:border-border-dark p-3">
          <View className="gap-1.5">
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.freqLabel')}</Text>
            <SegmentedField value={rule.freq} onChange={freq => patch({ freq })} options={FREQ_OPTIONS} />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.intervalLabel')}</Text>
            <TextInput
              keyboardType="number-pad"
              value={String(rule.interval)}
              onChangeText={text => {
                const n = Number(text);
                patch({
                  interval: Number.isFinite(n)
                    ? Math.min(RECURRENCE_MAX_INTERVAL, Math.max(RECURRENCE_MIN_INTERVAL, n))
                    : RECURRENCE_MIN_INTERVAL,
                });
              }}
              className="h-10 w-24 rounded-md border border-input dark:border-input-dark px-3 text-sm text-foreground dark:text-foreground-dark bg-background dark:bg-background-dark"
            />
          </View>

          {rule.freq === RecurrenceFreq.WEEKLY && (
            <View className="gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.weekdayLabel')}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {RECURRENCE_WEEKDAYS.map(day => {
                  const active = rule.byWeekday.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleWeekday(day)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={cn(
                        'h-8 min-w-11 items-center justify-center rounded-md border px-2',
                        active
                          ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
                          : 'border-input dark:border-input-dark bg-transparent'
                      )}>
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          active ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
                        )}>
                        {t(`weekdayShort.${day}` as 'weekdayShort.0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {rule.freq === RecurrenceFreq.MONTHLY && (
            <View className="gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.monthdayLabel')}</Text>
              <Select
                value={String(rule.byMonthday ?? 1)}
                onValueChange={v => patch({ byMonthday: Number(v) })}
                options={MONTHDAY_OPTIONS}>
                <SelectTrigger />
              </Select>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.startDateLabel')}</Text>
              <InlineDateField value={rule.startDate} onChange={v => patch({ startDate: v })} />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.endLabel')}</Text>
              <SegmentedField
                value={rule.endDate ? RecurrenceEnd.ON_DATE : RecurrenceEnd.NEVER}
                onChange={mode =>
                  patch({ endDate: mode === RecurrenceEnd.ON_DATE ? (rule.endDate ?? rule.startDate) : null })
                }
                options={END_OPTIONS}
              />
            </View>
          </View>

          {rule.endDate != null && (
            <View className="gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('field.endDateLabel')}</Text>
              <InlineDateField value={rule.endDate ?? ""} onChange={v => patch({ endDate: v })} />
            </View>
          )}

          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{summarize(rule)}</Text>
        </View>
      )}
    </View>
  );
}

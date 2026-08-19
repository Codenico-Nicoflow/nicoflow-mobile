import {
  MONTHDAY_LAST,
  RECURRENCE_MAX_INTERVAL,
  RECURRENCE_MIN_INTERVAL,
  RECURRENCE_WEEKDAYS,
  RecurrenceEnd,
  RecurrenceFreq,
} from '@nicoflow/shared/types';
import { summarizeRecurrence } from '@nicoflow/shared/utils';
import { Repeat } from 'lucide-react-native';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { Select, SelectTrigger } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/cn';

import { defaultRecurrence, type RecurrenceValue } from './recurrence';

// Plain YYYY-MM-DD text entry — deliberately NOT DateField (Sheet+Calendar)
// here. DateField's own Sheet mounting in the same synchronous render as
// the Repeats Switch's toggle-on animation is the last remaining candidate
// for a native SIGABRT that survived removing the two Selects (Frequency,
// End) that were also mounting alongside it. Isolating this to a plain
// TextInput removes every native-modal-mount that happens simultaneously
// with the toggle, to confirm or rule out the mechanism.
function InlineDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
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

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQ_OPTIONS = [
  { label: 'Daily', value: RecurrenceFreq.DAILY },
  { label: 'Weekly', value: RecurrenceFreq.WEEKLY },
  { label: 'Monthly', value: RecurrenceFreq.MONTHLY },
  { label: 'Yearly', value: RecurrenceFreq.YEARLY },
];

const END_OPTIONS = [
  { label: 'Never', value: RecurrenceEnd.NEVER },
  { label: 'On date', value: RecurrenceEnd.ON_DATE },
];

const MONTHDAY_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
  { label: 'Last day of month', value: String(MONTHDAY_LAST) },
];

// Renders a plain-English summary from the framework-agnostic
// summarizeRecurrence descriptor — mobile has no i18n infra yet, unlike
// web's useRecurrenceSummary, so this is a direct string build instead of a
// translation-key lookup.
function summaryText(rule: RecurrenceValue): string {
  const s = summarizeRecurrence(rule);
  const days = s.weekdays.map(d => WEEKDAY_LABELS[d]).join(', ');
  const plural = s.count === 1 ? '' : `${s.count} `;
  const every = s.count === 1 ? 'Every' : `Every ${s.count}`;

  let base: string;
  switch (s.key) {
    case 'summary.weekly':
      base = `${every} week${s.count === 1 ? '' : 's'} on ${days}`;
      break;
    case 'freq.weekly':
      base = 'Weekly';
      break;
    case 'summary.monthly':
      base = `${every} month${s.count === 1 ? '' : 's'} on day ${s.day}`;
      break;
    case 'summary.monthlyLast':
      base = `${every} month${s.count === 1 ? '' : 's'} on the last day`;
      break;
    case 'summary.yearly':
      base = `${plural}${s.count === 1 ? 'Every' : ''} year${s.count === 1 ? '' : 's'}`.trim() || 'Every year';
      break;
    default:
      base = `${every} day${s.count === 1 ? '' : 's'}`;
  }

  return s.endDate ? `${base}, until ${s.endDate}` : base;
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
  const isDark = useColorScheme() === 'dark';
  const enabled = value !== null;
  const rule = value ?? defaultRecurrence();

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
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Repeats</Text>
          </View>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            Turn this into a repeating task.
          </Text>
        </View>
        <Switch checked={enabled} onCheckedChange={on => onChange(on ? defaultRecurrence() : null)} />
      </View>

      {enabled && (
        <View className="gap-3 rounded-md border border-border dark:border-border-dark p-3">
          <View className="gap-1.5">
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">Frequency</Text>
            <SegmentedField value={rule.freq} onChange={freq => patch({ freq })} options={FREQ_OPTIONS} />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">Every</Text>
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
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">On days</Text>
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
                        {WEEKDAY_LABELS[day]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {rule.freq === RecurrenceFreq.MONTHLY && (
            <View className="gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">On day</Text>
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
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">Starts</Text>
              <InlineDateField value={rule.startDate} onChange={v => patch({ startDate: v })} />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">Ends</Text>
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
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">End date</Text>
              <InlineDateField value={rule.endDate ?? ""} onChange={v => patch({ endDate: v })} />
            </View>
          )}

          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{summaryText(rule)}</Text>
        </View>
      )}
    </View>
  );
}

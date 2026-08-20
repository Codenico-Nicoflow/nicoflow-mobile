import { CalendarClock, X } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Calendar } from '@/components/ui/calendar';
import { Sheet, type SheetRef } from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MONTH_DAY = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' });

interface DateFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
}

// A calendar-picker trigger, factored out of ScheduledForField so
// RecurrenceField's start/end date pickers (and any future date field) don't
// each reimplement the Sheet+Calendar wiring. Nesting a picker Sheet inside
// another Sheet works because Sheet sets stackBehavior="push" — see its own
// comment for why that matters.
export function DateField({ value, onChange, placeholder = 'Pick a date', clearable = true }: DateFieldProps) {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';
  const selectedDate = value ? parseISODate(value) : undefined;
  const pickerRef = useRef<SheetRef>(null);

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => pickerRef.current?.present()}
        accessibilityRole="button"
        className="h-10 flex-1 flex-row items-center gap-2 rounded-md border border-input dark:border-input-dark px-3">
        <CalendarClock size={16} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text
          className={cn(
            'text-sm',
            selectedDate ? 'text-foreground dark:text-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
          )}>
          {selectedDate ? MONTH_DAY.format(selectedDate) : placeholder}
        </Text>
      </Pressable>

      {clearable && selectedDate && (
        <Pressable
          onPress={() => onChange(null)}
          accessibilityRole="button"
          accessibilityLabel={t('fields.clearDate')}
          className="h-10 w-10 items-center justify-center rounded-md border border-input dark:border-input-dark">
          <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      )}

      <Sheet ref={pickerRef} snapPoints={['60%']}>
        <Calendar
          selected={selectedDate}
          onSelect={date => {
            onChange(toISODate(date));
            pickerRef.current?.dismiss();
          }}
        />
      </Sheet>
    </View>
  );
}

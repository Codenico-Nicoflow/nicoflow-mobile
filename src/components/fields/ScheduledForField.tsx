import { CalendarClock, X } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Calendar } from '@/components/ui/calendar';
import { Sheet, type SheetRef } from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MONTH_DAY = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' });

interface ScheduledForFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

// A calendar picker needs its own overlay, and RN's plain Modal (what
// components/ui/popover.tsx uses) rendered fine standalone but glitched
// (ghosted/offset icon) when opened from inside another BottomSheetModal —
// the same nested-overlay fragility as the earlier Select auto-close bug.
// Reusing Sheet (stackBehavior="push", already proven for nested Selects)
// avoids mixing RN Modal with gorhom's own overlay system.
export function ScheduledForField({ value, onChange }: ScheduledForFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const selectedDate = value ? parseISODate(value) : undefined;
  const pickerRef = useRef<SheetRef>(null);

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CalendarClock} label="Scheduled for" optional />
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
            {selectedDate ? MONTH_DAY.format(selectedDate) : 'Pick a date'}
          </Text>
        </Pressable>

        {selectedDate && (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Clear date"
            className="h-10 w-10 items-center justify-center rounded-md border border-input dark:border-input-dark">
            <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        )}
      </View>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        Carries forward if not done, never marked overdue.
      </Text>

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

import { CalendarClock, X } from 'lucide-react-native';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export function ScheduledForField({ value, onChange }: ScheduledForFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const selectedDate = value ? parseISODate(value) : undefined;

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CalendarClock} label="Scheduled for" optional />
      <View className="flex-row gap-2">
        <Popover>
          <PopoverTrigger>
            <View
              className={cn(
                'h-10 flex-1 flex-row items-center gap-2 rounded-md border border-input dark:border-input-dark px-3'
              )}>
              <CalendarClock size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text
                className={cn(
                  'text-sm',
                  selectedDate ? 'text-foreground dark:text-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
                )}>
                {selectedDate ? MONTH_DAY.format(selectedDate) : 'Pick a date'}
              </Text>
            </View>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <Calendar selected={selectedDate} onSelect={date => onChange(toISODate(date))} />
          </PopoverContent>
        </Popover>

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
    </View>
  );
}

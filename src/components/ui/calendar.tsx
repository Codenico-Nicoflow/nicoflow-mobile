import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

export interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = first.getDay();
  const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function Calendar({ selected, onSelect, month, onMonthChange }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const viewedMonth = useMemo(() => month ?? selected ?? today, [month, selected, today]);
  const cells = useMemo(() => buildMonthGrid(viewedMonth), [viewedMonth]);

  const changeMonth = (delta: number) => {
    onMonthChange?.(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + delta, 1));
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Pressable
          onPress={() => changeMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="p-2"
        >
          <Text className="text-foreground dark:text-foreground-dark">{'<'}</Text>
        </Pressable>
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
          {viewedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          onPress={() => changeMonth(1)}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="p-2"
        >
          <Text className="text-foreground dark:text-foreground-dark">{'>'}</Text>
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} className="flex-1 items-center py-1">
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((date, index) => {
          if (!date) return <View key={`blank-${index}`} className="aspect-square w-[14.28%]" />;

          const isSelected = selected ? isSameDay(date, selected) : false;
          const isToday = isSameDay(date, today);

          return (
            <View key={date.toISOString()} className="aspect-square w-[14.28%] items-center justify-center p-0.5">
              <Pressable
                onPress={() => onSelect(date)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'h-full w-full items-center justify-center rounded-md',
                  isSelected && 'bg-primary dark:bg-primary-dark',
                  !isSelected && isToday && 'border border-ring dark:border-ring-dark'
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    isSelected ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
                  )}
                >
                  {date.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

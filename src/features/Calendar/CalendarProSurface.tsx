import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppUser, useGetCalendarTasksQuery } from '@/lib/store';

import {
  buildMonthDays,
  fromDayKey,
  groupTasksByDay,
  MAX_VISIBLE_CHIPS,
  normalizeWeekStart,
  rangeForMonth,
  shiftMonth,
  todayKeyIn,
} from './calendarDate';
import { CalendarDaySheet, type CalendarDaySheetRef } from './CalendarDaySheet';

const SWIPE_THRESHOLD = 48;

const taskChip = (task: ITask) => (
  <Pressable
    key={task.id}
    onPress={() => router.push(`/task/${task.id}`)}
    accessibilityRole="button"
    accessibilityLabel={task.title}
    className="mt-1 rounded bg-primary/10 px-1 py-0.5"
    testID={`calendar-task-${task.id}`}
  >
    <Text numberOfLines={1} className="text-[10px] font-medium text-primary">
      {task.title}
    </Text>
  </Pressable>
);

export function CalendarProSurface() {
  const { t, i18n } = useTranslation('common');
  const colors = useTheme();
  const user = useAppUser();
  const todayKey = todayKeyIn(user?.timezone);
  const [anchor, setAnchor] = useState(() => fromDayKey(todayKey));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const daySheetRef = useRef<CalendarDaySheetRef>(null);
  const weekStart = normalizeWeekStart(user?.calendar?.weekStart);
  const days = useMemo(() => buildMonthDays(anchor, weekStart), [anchor, weekStart]);
  const range = useMemo(() => rangeForMonth(days), [days]);
  const { data: tasks = [], isLoading, isError, refetch } = useGetCalendarTasksQuery(range);
  const tasksByDay = useMemo(() => groupTasksByDay(tasks), [tasks]);

  const moveMonth = (amount: -1 | 1): void => setAnchor(current => shiftMonth(current, amount));
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .runOnJS(true)
        .onEnd((event, success) => {
          if (!success || Math.abs(event.translationX) < SWIPE_THRESHOLD) return;
          moveMonth(event.translationX < 0 ? 1 : -1);
        }),
    []
  );

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(anchor);
  const weekdayLabels = Array.from({ length: 7 }, (_, offset) => {
    const referenceSunday = new Date(2026, 7, 2 + ((weekStart + offset) % 7), 12);
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(referenceSunday);
  });

  return (
    <View className="flex-1 px-3 py-4" testID="calendar-pro-surface">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => moveMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.previousMonth')}
          className="h-9 w-9 items-center justify-center rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          testID="calendar-previous-month"
        >
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <Text className="text-xl font-bold text-foreground dark:text-foreground-dark" testID="calendar-month-label">
          {monthLabel}
        </Text>
        <Pressable
          onPress={() => moveMonth(1)}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.nextMonth')}
          className="h-9 w-9 items-center justify-center rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          testID="calendar-next-month"
        >
          <ChevronRight size={18} color={colors.text} />
        </Pressable>
      </View>

      <GestureDetector gesture={swipe}>
        <View
          className="overflow-hidden border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          style={[{ borderRadius: Radius.lg }, Shadows.sm]}
          testID="calendar-month-grid"
        >
          <View className="flex-row border-b border-border dark:border-border-dark">
            {weekdayLabels.map((label, index) => (
              <View key={`${label}-${index}`} className="flex-1 items-center py-2">
                <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View className="h-72 items-center justify-center gap-2" accessibilityRole="progressbar">
              <ActivityIndicator color={colors.primary} />
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {t('pages.calendar.loadingTasks')}
              </Text>
            </View>
          ) : isError ? (
            <View className="h-72 items-center justify-center gap-3 px-6" accessibilityRole="alert">
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark text-center">
                {t('pages.calendar.loadError')}
              </Text>
              <Pressable
                onPress={() => void refetch()}
                accessibilityRole="button"
                className="rounded-md bg-primary px-4 py-2"
              >
                <Text className="text-sm font-semibold text-primary-foreground">{t('pages.calendar.retry')}</Text>
              </Pressable>
            </View>
          ) : (
            Array.from({ length: 6 }, (_, row) => (
              <View key={row} className="flex-row border-b border-border dark:border-border-dark">
                {days.slice(row * 7, row * 7 + 7).map(day => {
                  const dayTasks = tasksByDay.get(day.key) ?? [];
                  const overflow = Math.max(0, dayTasks.length - MAX_VISIBLE_CHIPS);
                  const isToday = day.key === todayKey;
                  const isSelected = day.key === selectedKey;
                  return (
                    <View
                      key={day.key}
                      className={`min-h-16 flex-1 border-r border-border dark:border-border-dark p-1 ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                      testID={`calendar-day-${day.key}`}
                    >
                      <Pressable
                        onPress={() => daySheetRef.current?.present(day.key)}
                        accessibilityRole="button"
                        accessibilityLabel={t('pages.calendar.dayLabel', { date: day.key, count: dayTasks.length })}
                        className={`h-5 w-5 items-center justify-center rounded-full ${isToday ? 'bg-primary' : ''}`}
                      >
                        <Text
                          className={`text-[11px] font-medium ${
                            isToday
                              ? 'text-primary-foreground'
                              : day.isCurrentMonth
                                ? 'text-foreground dark:text-foreground-dark'
                                : 'text-muted-foreground/50 dark:text-muted-foreground-dark/50'
                          }`}
                        >
                          {day.dayOfMonth}
                        </Text>
                      </Pressable>
                      {dayTasks.slice(0, MAX_VISIBLE_CHIPS).map(taskChip)}
                      {overflow > 0 && (
                        <Pressable
                          onPress={() => daySheetRef.current?.present(day.key)}
                          accessibilityRole="button"
                          accessibilityLabel={t('pages.calendar.showAllTasks', {
                            date: day.key,
                            count: dayTasks.length,
                          })}
                        >
                          <Text className="mt-1 text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                            {t('pages.calendar.more', { count: overflow })}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </GestureDetector>
      <CalendarDaySheet
        ref={daySheetRef}
        tasksByDay={tasksByDay}
        locale={i18n.language}
        onSelectedDayChange={setSelectedKey}
      />
    </View>
  );
}

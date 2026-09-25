import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { ITask } from '@nicoflow/shared/types';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { toast } from '@/components/ui/toast';
import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mobileWSLifecycleAdapter, useAppUser, useGetCalendarTasksQuery, useUpdateTaskMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

import {
  buildMonthDays,
  buildWeekDays,
  fromDayKey,
  groupTasksByDay,
  MAX_VISIBLE_CHIPS,
  normalizeWeekStart,
  rangeForDays,
  rangeForMonth,
  shiftDay,
  shiftMonth,
  todayKeyIn,
} from './calendarDate';
import { CalendarDaySheet, type CalendarDaySheetRef } from './CalendarDaySheet';
import { calendarMoveRequest, calendarScheduleRequest, isLiveRecurringOccurrence } from './calendarMove';
import { canRetryCalendarFailure, isCalendarOfflineFailure } from './calendarRecovery';
import { CalendarTaskAgendaCard } from './CalendarTaskAgendaCard';
import { CalendarTaskChip } from './CalendarTaskChip';

const SWIPE_THRESHOLD = 48;
type CalendarView = 'month' | 'week' | 'day';

export function CalendarProSurface() {
  const { t, i18n } = useTranslation('common');
  const colors = useTheme();
  const user = useAppUser();
  const todayKey = todayKeyIn(user?.timezone);
  const [anchor, setAnchor] = useState(() => fromDayKey(todayKey));
  const [view, setView] = useState<CalendarView>('month');
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const daySheetRef = useRef<CalendarDaySheetRef>(null);
  const pendingTaskIdsRef = useRef(new Set<string>());
  const [pendingTaskIds, setPendingTaskIds] = useState<ReadonlySet<string>>(() => new Set());
  const [dragTargetKey, setDragTargetKey] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [updateTask] = useUpdateTaskMutation();
  const weekStart = normalizeWeekStart(user?.calendar?.weekStart);
  const monthDays = useMemo(() => buildMonthDays(anchor, weekStart), [anchor, weekStart]);
  const weekDays = useMemo(() => buildWeekDays(fromDayKey(selectedKey), weekStart), [selectedKey, weekStart]);
  const selectedDay = weekDays.find(day => day.key === selectedKey) ?? weekDays[0]!;
  const days = view === 'month' ? monthDays : view === 'week' ? weekDays : [selectedDay];
  const range = useMemo(
    () => (view === 'month' ? rangeForMonth(monthDays) : rangeForDays(view === 'week' ? weekDays : [selectedDay])),
    [monthDays, selectedDay, view, weekDays]
  );
  const { currentData: tasks = [], error, isLoading, isError, refetch } = useGetCalendarTasksQuery(range);
  const tasksByDay = useMemo(() => groupTasksByDay(tasks), [tasks]);
  const isOffline = isCalendarOfflineFailure(error);

  useEffect(() => mobileWSLifecycleAdapter.onForeground(() => void refetch()), [refetch]);

  const recoverFailedWrite = async (mutationError: unknown, retry: () => void): Promise<void> => {
    await refetch();
    const message = resolveApiErrorMessage(mutationError);
    if (canRetryCalendarFailure(mutationError)) {
      toast.errorWithRetry(message, { label: t('actions.retry'), onPress: retry });
      return;
    }
    toast.error(message);
  };

  const moveTask = async (task: ITask, scheduledFor: string): Promise<void> => {
    if (task.scheduledFor === scheduledFor || pendingTaskIdsRef.current.has(task.id)) return;
    if (isLiveRecurringOccurrence(task)) {
      toast.error(t('pages.calendar.recurringMoveLocked'));
      return;
    }
    pendingTaskIdsRef.current.add(task.id);
    setPendingTaskIds(current => new Set(current).add(task.id));
    try {
      await updateTask(calendarMoveRequest(task, scheduledFor)).unwrap();
    } catch (error) {
      await recoverFailedWrite(error, () => void moveTask(task, scheduledFor));
      throw error;
    } finally {
      pendingTaskIdsRef.current.delete(task.id);
      setPendingTaskIds(current => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const saveSchedule = async (
    task: ITask,
    scheduledFor: string,
    scheduledTime: string | null,
    estimatedMinutes: number | null
  ): Promise<void> => {
    if (pendingTaskIdsRef.current.has(task.id)) return;
    pendingTaskIdsRef.current.add(task.id);
    setPendingTaskIds(current => new Set(current).add(task.id));
    try {
      await updateTask(calendarScheduleRequest(task, scheduledFor, scheduledTime, estimatedMinutes)).unwrap();
    } catch (error) {
      await recoverFailedWrite(error, () => void saveSchedule(task, scheduledFor, scheduledTime, estimatedMinutes));
      throw error;
    } finally {
      pendingTaskIdsRef.current.delete(task.id);
      setPendingTaskIds(current => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const saveDuration = async (task: ITask, estimatedMinutes: number): Promise<void> => {
    if (pendingTaskIdsRef.current.has(task.id)) return;
    pendingTaskIdsRef.current.add(task.id);
    setPendingTaskIds(current => new Set(current).add(task.id));
    try {
      await updateTask({ id: task.id, estimatedMinutes }).unwrap();
    } catch (error) {
      await recoverFailedWrite(error, () => void saveDuration(task, estimatedMinutes));
      throw error;
    } finally {
      pendingTaskIdsRef.current.delete(task.id);
      setPendingTaskIds(current => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const movePeriod = useCallback(
    (amount: -1 | 1): void => {
      if (view === 'month') setAnchor(current => shiftMonth(current, amount));
      else {
        const next = shiftDay(selectedKey, amount * (view === 'week' ? 7 : 1));
        setSelectedKey(next);
        setAnchor(fromDayKey(next));
      }
    },
    [selectedKey, view]
  );
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .runOnJS(true)
        .onEnd((event, success) => {
          if (!success || Math.abs(event.translationX) < SWIPE_THRESHOLD) return;
          movePeriod(event.translationX < 0 ? 1 : -1);
        }),
    [movePeriod]
  );

  const periodLabel =
    view === 'month'
      ? new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(anchor)
      : view === 'week'
        ? `${new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(fromDayKey(weekDays[0]?.key ?? selectedKey))} – ${new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }).format(fromDayKey(weekDays[6]?.key ?? selectedKey))}`
        : new Intl.DateTimeFormat(i18n.language, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(fromDayKey(selectedKey));
  const weekdayLabels = Array.from({ length: 7 }, (_, offset) => {
    const referenceSunday = new Date(2026, 7, 2 + ((weekStart + offset) % 7), 12);
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(referenceSunday);
  });

  return (
    <View className="flex-1 px-3 py-4" testID="calendar-pro-surface">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => movePeriod(-1)}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.previousPeriod', { period: t(`pages.calendar.${view}View`) })}
          className="h-9 w-9 items-center justify-center rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          testID="calendar-previous-month"
        >
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <Text className="text-xl font-bold text-foreground dark:text-foreground-dark" testID="calendar-period-label">
          {periodLabel}
        </Text>
        <Pressable
          onPress={() => movePeriod(1)}
          accessibilityRole="button"
          accessibilityLabel={t('pages.calendar.nextPeriod', { period: t(`pages.calendar.${view}View`) })}
          className="h-9 w-9 items-center justify-center rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          testID="calendar-next-month"
        >
          <ChevronRight size={18} color={colors.text} />
        </Pressable>
      </View>

      <View className="mb-3 flex-row justify-center gap-2" accessibilityRole="tablist" testID="calendar-view-switcher">
        {(['month', 'week', 'day'] as const).map(option => (
          <Pressable
            key={option}
            onPress={() => setView(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === option }}
            className={`rounded-md px-3 py-2 ${view === option ? 'bg-primary' : 'border border-border dark:border-border-dark'}`}
            testID={`calendar-view-${option}`}
          >
            <Text
              className={`text-xs font-semibold ${view === option ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'}`}
            >
              {t(`pages.calendar.${option}View`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <GestureDetector gesture={swipe}>
        <View
          className="overflow-hidden border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          style={[{ borderRadius: Radius.lg }, Shadows.sm]}
          testID={view === 'month' ? 'calendar-month-grid' : 'calendar-agenda'}
          onLayout={event => setGridSize(event.nativeEvent.layout)}
        >
          {view === 'month' ? (
            <View className="flex-row border-b border-border dark:border-border-dark">
              {weekdayLabels.map((label, index) => (
                <View key={`${label}-${index}`} className="flex-1 items-center py-2">
                  <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

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
                {t(isOffline ? 'pages.calendar.offlineError' : 'pages.calendar.loadError')}
              </Text>
              <Pressable
                onPress={() => void refetch()}
                accessibilityRole="button"
                className="rounded-md bg-primary px-4 py-2"
              >
                <Text className="text-sm font-semibold text-primary-foreground">{t('pages.calendar.retry')}</Text>
              </Pressable>
            </View>
          ) : view === 'month' ? (
            Array.from({ length: 6 }, (_, row) => (
              <View key={row} className="flex-row border-b border-border dark:border-border-dark">
                {monthDays.slice(row * 7, row * 7 + 7).map((day, column) => {
                  const dayTasks = tasksByDay.get(day.key) ?? [];
                  const overflow = Math.max(0, dayTasks.length - MAX_VISIBLE_CHIPS);
                  const isToday = day.key === todayKey;
                  const isSelected = day.key === selectedKey;
                  const isDragTarget = day.key === dragTargetKey;
                  const dayIndex = row * 7 + column;
                  return (
                    <View
                      key={day.key}
                      className={`min-h-16 flex-1 border-r border-border dark:border-border-dark p-1 ${
                        isDragTarget ? 'bg-primary/15' : isSelected ? 'bg-primary/5' : ''
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
                      {dayTasks.slice(0, MAX_VISIBLE_CHIPS).map(task => (
                        <CalendarTaskChip
                          key={task.id}
                          task={task}
                          days={days}
                          sourceIndex={dayIndex}
                          gridWidth={gridSize.width}
                          gridHeight={gridSize.height}
                          disabled={pendingTaskIds.has(task.id) || isLiveRecurringOccurrence(task)}
                          onTargetChange={setDragTargetKey}
                          onMove={moveTask}
                        />
                      ))}
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
          ) : (
            days.map(day => {
              const dayTasks = tasksByDay.get(day.key) ?? [];
              const label = new Intl.DateTimeFormat(i18n.language, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).format(fromDayKey(day.key));
              return (
                <View
                  key={day.key}
                  className="mb-3 rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark p-3"
                  testID={`calendar-agenda-day-${day.key}`}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedKey(day.key);
                      daySheetRef.current?.present(day.key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('pages.calendar.dayLabel', { date: label, count: dayTasks.length })}
                    className="mb-2 flex-row items-center justify-between"
                  >
                    <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">{label}</Text>
                    <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                      {t('pages.calendar.dayTaskCount', { count: dayTasks.length })}
                    </Text>
                  </Pressable>
                  {dayTasks.length === 0 ? (
                    <Text className="py-3 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {t('pages.calendar.emptyDayDescription')}
                    </Text>
                  ) : (
                    dayTasks.map(task => (
                      <CalendarTaskAgendaCard
                        key={task.id}
                        task={task}
                        pending={pendingTaskIds.has(task.id)}
                        onSaveSchedule={saveSchedule}
                        onSaveDuration={saveDuration}
                      />
                    ))
                  )}
                </View>
              );
            })
          )}
        </View>
      </GestureDetector>
      {dragTargetKey ? (
        <View className="absolute bottom-5 self-center rounded-full bg-foreground dark:bg-foreground-dark px-4 py-2">
          <Text className="text-xs font-semibold text-background dark:text-background-dark">
            {t('pages.calendar.dropOnDate', { date: dragTargetKey })}
          </Text>
        </View>
      ) : null}
      {pendingTaskIds.size > 0 ? (
        <View
          className="absolute top-16 self-center rounded-full bg-foreground dark:bg-foreground-dark px-4 py-2"
          accessibilityLiveRegion="polite"
          testID="calendar-saving"
        >
          <Text className="text-xs font-semibold text-background dark:text-background-dark">
            {t('pages.calendar.saving')}
          </Text>
        </View>
      ) : null}
      <CalendarDaySheet
        ref={daySheetRef}
        tasksByDay={tasksByDay}
        locale={i18n.language}
        onSelectedDayChange={setSelectedKey}
        onMoveTask={moveTask}
        pendingTaskIds={pendingTaskIds}
        onSaveDuration={saveDuration}
      />
    </View>
  );
}

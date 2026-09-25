import { useMemo, useRef, useState } from 'react';
import { I18nManager, Pressable, ScrollView, Text, View } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';

import { CalendarDayTaskCard } from './CalendarDayTaskCard';
import { CalendarScheduleEditor } from './CalendarScheduleEditor';
import { layoutTimedTasks, parseClockMinutes, resizeTaskMinutes, shiftTaskMinutes } from './calendarTimeline';

const PIXELS_PER_MINUTE = 1.4;
const HOUR_HEIGHT = PIXELS_PER_MINUTE * 60;
const TIME_GUTTER = 54;

interface CalendarDayTimelineProps {
  dayKey: string;
  locale: string;
  tasks: readonly ITask[];
  pendingTaskIds: ReadonlySet<string>;
  onSaveSchedule: (
    task: ITask,
    scheduledFor: string,
    scheduledTime: string | null,
    estimatedMinutes: number | null
  ) => Promise<void>;
}

const clockFromMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export function CalendarDayTimeline({
  dayKey,
  locale,
  tasks,
  pendingTaskIds,
  onSaveSchedule,
}: CalendarDayTimelineProps) {
  const { t } = useTranslation('common');
  const scheduleSheetRef = useRef<SheetRef>(null);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const timedTasks = useMemo(() => layoutTimedTasks(tasks, PIXELS_PER_MINUTE), [tasks]);
  const allDayTasks = useMemo(() => tasks.filter(task => parseClockMinutes(task.scheduledTime) === null), [tasks]);

  const startEditing = (task: ITask): void => {
    setEditingTask(task);
    scheduleSheetRef.current?.present();
  };

  const saveMovedTime = async (task: ITask, deltaY: number): Promise<void> => {
    const start = parseClockMinutes(task.scheduledTime);
    if (start === null) return;
    await onSaveSchedule(
      task,
      task.scheduledFor ?? dayKey,
      clockFromMinutes(shiftTaskMinutes(start, deltaY / PIXELS_PER_MINUTE)),
      task.estimatedMinutes ?? null
    );
  };

  const saveResizedDuration = async (task: ITask, deltaY: number): Promise<void> => {
    const start = parseClockMinutes(task.scheduledTime);
    if (start === null) return;
    await onSaveSchedule(
      task,
      task.scheduledFor ?? dayKey,
      task.scheduledTime ?? null,
      resizeTaskMinutes(task.estimatedMinutes ?? 30, deltaY / PIXELS_PER_MINUTE, start)
    );
  };

  return (
    <View className="flex-1" testID="calendar-day-timeline">
      <View className="mb-2 rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark p-3">
        <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground dark:text-muted-foreground-dark">
          {t('pages.calendar.allDayTasks')}
        </Text>
        {allDayTasks.length === 0 ? (
          <Text className="py-1 text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('pages.calendar.noAllDayTasks')}
          </Text>
        ) : (
          <View className="gap-2" testID="calendar-timeline-all-day-list">
            {allDayTasks.map(task => (
              <View key={task.id} testID={`calendar-timeline-all-day-${task.id}`}>
                <CalendarDayTaskCard
                  task={task}
                  dayKey={dayKey}
                  locale={locale}
                  pending={pendingTaskIds.has(task.id)}
                  onOpenTask={taskId => router.push(`/task/${taskId}`)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {tasks.length === 0 ? (
        <View className="mb-2 rounded-lg border border-border dark:border-border-dark p-3">
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('pages.calendar.emptyDayDescription')}
          </Text>
        </View>
      ) : null}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} testID="calendar-timeline-scroll">
        <View style={{ height: HOUR_HEIGHT * 24 }} testID="calendar-timeline-grid">
          {Array.from({ length: 24 }, (_, hour) => (
            <View
              key={hour}
              className="absolute left-0 right-0 flex-row border-t border-border dark:border-border-dark"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              testID={`calendar-hour-${String(hour).padStart(2, '0')}`}
            >
              <Text className="w-[54px] pt-1 text-right pr-2 text-xs text-muted-foreground dark:text-muted-foreground-dark">
                {`${String(hour).padStart(2, '0')}:00`}
              </Text>
              <View className="flex-1 border-l border-border dark:border-border-dark" />
            </View>
          ))}
          <View
            className="absolute bottom-0 top-0"
            style={I18nManager.isRTL ? { right: TIME_GUTTER, left: 0 } : { left: TIME_GUTTER, right: 0 }}
            testID="calendar-timeline-block-layer"
          >
            {timedTasks.map(layout => {
              const resizeGesture = Gesture.Pan()
                .activeOffsetY([-4, 4])
                .failOffsetX([-12, 12])
                .runOnJS(true)
                .onEnd((event, success) => {
                  if (success && !pendingTaskIds.has(layout.task.id)) {
                    void saveResizedDuration(layout.task, event.translationY);
                  }
                });
              const moveGesture = Gesture.Pan()
                .activeOffsetY([-8, 8])
                .failOffsetX([-12, 12])
                .requireExternalGestureToFail(resizeGesture)
                .runOnJS(true)
                .onEnd((event, success) => {
                  if (success && !pendingTaskIds.has(layout.task.id))
                    void saveMovedTime(layout.task, event.translationY);
                });
              const inlinePercent = `${(layout.column / layout.columns) * 100}%` as `${number}%`;
              const widthPercent = `${100 / layout.columns}%` as `${number}%`;

              return (
                <GestureDetector key={layout.task.id} gesture={moveGesture}>
                  <View
                    className="absolute overflow-hidden rounded-md border border-primary/40 bg-primary/10 px-2 py-1"
                    style={[
                      { top: layout.top, height: Math.max(40, layout.height), width: widthPercent },
                      I18nManager.isRTL ? { right: inlinePercent } : { left: inlinePercent },
                    ]}
                    testID={`calendar-timeline-task-${layout.task.id}`}
                  >
                    <Pressable
                      onPress={() => router.push(`/task/${layout.task.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={t('pages.calendar.openTask', { title: layout.task.title })}
                      accessibilityState={{ busy: pendingTaskIds.has(layout.task.id) }}
                      className="flex-1 pr-8"
                    >
                      <Text
                        className="text-xs font-semibold text-foreground dark:text-foreground-dark"
                        numberOfLines={1}
                      >
                        {layout.task.title}
                      </Text>
                      <Text
                        className="text-[10px] text-muted-foreground dark:text-muted-foreground-dark"
                        numberOfLines={1}
                      >
                        {layout.task.scheduledTime} · {layout.task.estimatedMinutes ?? 30} min
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => startEditing(layout.task)}
                      accessibilityRole="button"
                      accessibilityLabel={t('pages.calendar.editSchedule', { title: layout.task.title })}
                      disabled={pendingTaskIds.has(layout.task.id)}
                      className="absolute right-1 top-1 h-6 min-w-6 items-center justify-center rounded-sm bg-primary/15"
                    >
                      <Text className="text-xs font-semibold text-primary">✎</Text>
                    </Pressable>
                    <GestureDetector gesture={resizeGesture}>
                      <View
                        className="absolute bottom-0 right-0 h-2 w-8 rounded-sm bg-primary/40"
                        accessible
                        accessibilityRole="adjustable"
                        accessibilityLabel={t('pages.calendar.resizeDuration')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID={`calendar-timeline-resize-${layout.task.id}`}
                      />
                    </GestureDetector>
                  </View>
                </GestureDetector>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Sheet ref={scheduleSheetRef} snapPoints={['65%']}>
        <SheetHeader>
          <SheetTitle>{editingTask?.title ?? ''}</SheetTitle>
        </SheetHeader>
        {editingTask ? (
          <CalendarScheduleEditor
            task={editingTask}
            pending={pendingTaskIds.has(editingTask.id)}
            onCancel={() => {
              setEditingTask(null);
              scheduleSheetRef.current?.dismiss();
            }}
            onSave={async (...args) => {
              await onSaveSchedule(...args);
              setEditingTask(null);
              scheduleSheetRef.current?.dismiss();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

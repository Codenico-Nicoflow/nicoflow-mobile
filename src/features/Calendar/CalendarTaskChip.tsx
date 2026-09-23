import { useCallback, useMemo } from 'react';
import { Pressable, Text } from 'react-native';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { CalendarDay } from './calendarDate';

interface CalendarTaskChipProps {
  task: ITask;
  days: readonly CalendarDay[];
  sourceIndex: number;
  gridWidth: number;
  gridHeight: number;
  disabled: boolean;
  onTargetChange: (dayKey: string | null) => void;
  onMove: (task: ITask, dayKey: string) => Promise<void>;
}

export function CalendarTaskChip({
  task,
  days,
  sourceIndex,
  gridWidth,
  gridHeight,
  disabled,
  onTargetChange,
  onMove,
}: CalendarTaskChipProps) {
  const resolveTarget = useCallback(
    (translationX: number, translationY: number): CalendarDay | undefined => {
      if (gridWidth <= 0 || gridHeight <= 0) return undefined;
      const columnDelta = Math.round(translationX / (gridWidth / 7));
      const rowDelta = Math.round(translationY / (gridHeight / 6));
      return days[sourceIndex + rowDelta * 7 + columnDelta];
    },
    [days, gridHeight, gridWidth, sourceIndex]
  );

  const drag = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activateAfterLongPress(350)
        .runOnJS(true)
        .onUpdate(event => onTargetChange(resolveTarget(event.translationX, event.translationY)?.key ?? null))
        .onEnd((event, success) => {
          const target = success ? resolveTarget(event.translationX, event.translationY) : undefined;
          onTargetChange(null);
          if (target && target.key !== task.scheduledFor) void onMove(task, target.key);
        })
        .onFinalize(() => onTargetChange(null)),
    [disabled, onMove, onTargetChange, resolveTarget, task]
  );

  return (
    <GestureDetector gesture={drag}>
      <Pressable
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
    </GestureDetector>
  );
}

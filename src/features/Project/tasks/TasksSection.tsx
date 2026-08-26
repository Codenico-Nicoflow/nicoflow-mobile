import { useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { type ITask, ScheduleFilter, type TaskEnergy, TaskStatus } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskSheet, type TaskSheetRef } from '@/features/TimeSpread/TaskSheet';
import { useGetTasksInfiniteQuery, useUpdateTaskStatusMutation } from '@/lib/store';

import { needsCompletionConfirm } from './completionGuard';
import {
  countTasks,
  defaultTaskFilter,
  matchesFilter,
  matchesScheduleFilter,
  TASK_FILTER,
  type TaskFilter,
} from './filters';
import { TaskFilters } from './TaskFilters';
import { TaskListItem } from './TaskListItem';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TasksEmptyState } from './TasksEmptyState';
import { TasksHeader } from './TasksHeader';

interface TasksSectionProps {
  projectId: string;
}

function TasksLoadingState() {
  return (
    <View style={{ gap: 12 }} testID="tasks-loading">
      {[0, 1, 2].map(i => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </View>
  );
}

// Mirrors web's TasksSection.tsx: status/energy/schedule filters composed
// client-side over the loaded list, quick-add always visible, tap-row to
// edit via TaskSheet. Server-side pagination (getTasks infinite query) is
// used only to fetch — filtering happens the same way web does it, over
// whatever's loaded.
export function TasksSection({ projectId }: TasksSectionProps) {
  const { t } = useTranslation('task');
  const { data, isLoading } = useGetTasksInfiniteQuery({ projectId });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const sheetRef = useRef<TaskSheetRef>(null);
  const completeConfirmRef = useRef<SheetRef>(null);
  const [pendingComplete, setPendingComplete] = useState<ITask | null>(null);

  const tasks = useMemo(() => data?.pages.flatMap(p => p.items) ?? [], [data]);

  const [pickedFilter, setPickedFilter] = useState<TaskFilter | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<(typeof ScheduleFilter)[keyof typeof ScheduleFilter]>(
    ScheduleFilter.ALL
  );
  const [activeEnergy, setActiveEnergy] = useState<TaskEnergy | 'all'>('all');

  const activeFilter = pickedFilter ?? defaultTaskFilter();

  const changeFilter = (next: TaskFilter) => {
    setPickedFilter(next);
    if (next !== TASK_FILTER.ACTIVE) setScheduleFilter(ScheduleFilter.ALL);
  };

  const taskCounts = useMemo(() => countTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => matchesFilter(task, activeFilter));
    if (activeFilter === TASK_FILTER.ACTIVE) {
      filtered = filtered.filter(task => matchesScheduleFilter(task, scheduleFilter));
    }
    if (activeEnergy !== 'all') {
      filtered = filtered.filter(task => task.energy === activeEnergy);
    }
    return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [tasks, activeFilter, scheduleFilter, activeEnergy]);

  const runToggle = (task: ITask, next: TaskStatus) => {
    void updateTaskStatus({ id: task.id, status: next });
  };

  // Gate fires only on completing with open subtasks — never on uncompleting
  // (mirrors web's useConfirmComplete: needsCompletionConfirm short-circuits
  // any transition that isn't INTO done).
  const onToggleStatus = (task: ITask) => {
    const next = task.status === TaskStatus.DONE ? TaskStatus.ACTIVE : TaskStatus.DONE;
    if (needsCompletionConfirm(task, next)) {
      setPendingComplete(task);
      completeConfirmRef.current?.present();
      return;
    }
    runToggle(task, next);
  };

  const onConfirmComplete = () => {
    if (pendingComplete) runToggle(pendingComplete, TaskStatus.DONE);
    completeConfirmRef.current?.dismiss();
    setPendingComplete(null);
  };

  return (
    <View className="flex-1 px-4 pt-3">
      <TasksHeader taskCount={tasks.length} onAddTask={() => sheetRef.current?.present({ projectId })} />

      {isLoading ? (
        <TasksLoadingState />
      ) : tasks.length > 0 ? (
        <FlatList
          testID="tasks-list"
          style={{ flex: 1 }}
          data={filteredTasks}
          keyExtractor={task => task.id}
          renderItem={({ item: task }) => (
            <TaskListItem
              task={task}
              onEdit={editTask => sheetRef.current?.present({ task: editTask })}
              onToggleStatus={onToggleStatus}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 16 }}>
              <TaskQuickAdd projectId={projectId} />
              <TaskFilters
                activeFilter={activeFilter}
                onFilterChange={changeFilter}
                activeEnergy={activeEnergy}
                onEnergyChange={setActiveEnergy}
                taskCounts={taskCounts}
                scheduleFilter={scheduleFilter}
                onScheduleFilterChange={setScheduleFilter}
              />
            </View>
          }
          ListEmptyComponent={
            <Text
              className="py-12 text-center text-muted-foreground dark:text-muted-foreground-dark"
              testID="task-no-results"
            >
              {t('noResults.filter')}
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <>
          <TaskQuickAdd projectId={projectId} />
          <TasksEmptyState onAddTask={() => sheetRef.current?.present({ projectId })} />
        </>
      )}

      <TaskSheet ref={sheetRef} onSaved={() => sheetRef.current?.dismiss()} />

      <Sheet
        ref={completeConfirmRef}
        snapPoints={['35%']}
        enablePanDownToClose={false}
        onDismiss={() => setPendingComplete(null)}
      >
        <SheetHeader>
          <SheetTitle>{t('completeConfirm.title')}</SheetTitle>
          <SheetDescription>
            {t('completeConfirm.description', { count: pendingComplete?.openSubtaskCount ?? 0 })}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button label={t('completeConfirm.confirm')} onPress={onConfirmComplete} />
        </SheetFooter>
      </Sheet>
    </View>
  );
}

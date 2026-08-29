import { useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { type ITask, ScheduleFilter, type TaskEnergy, TaskStatus } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskSheet, type TaskSheetRef } from '@/features/TimeSpread/TaskSheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGetTasksInfiniteQuery, useReorderTaskMutation, useUpdateTaskStatusMutation } from '@/lib/store';

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
import { TaskSearch } from './TaskSearch';
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
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGetTasksInfiniteQuery({
    projectId,
  });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [reorderTask] = useReorderTaskMutation();
  const sheetRef = useRef<TaskSheetRef>(null);
  const completeConfirmRef = useRef<SheetRef>(null);
  const [pendingComplete, setPendingComplete] = useState<ITask | null>(null);

  const tasks = useMemo(() => data?.pages.flatMap(p => p.items) ?? [], [data]);

  const [pickedFilter, setPickedFilter] = useState<TaskFilter | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<(typeof ScheduleFilter)[keyof typeof ScheduleFilter]>(
    ScheduleFilter.ALL
  );
  const [activeEnergy, setActiveEnergy] = useState<TaskEnergy | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

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
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        task => task.title.toLowerCase().includes(query) || (task.notes ?? '').toLowerCase().includes(query)
      );
    }
    return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [tasks, activeFilter, scheduleFilter, activeEnergy, debouncedSearch]);

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

  const onTasksDragEnd = ({ data, to }: { data: ITask[]; from: number; to: number }) => {
    const movedTask = data[to];
    const targetDisplayOrder = filteredTasks[to]?.displayOrder;
    if (!movedTask || targetDisplayOrder === undefined) return;
    void reorderTask({ id: movedTask.id, displayOrder: targetDisplayOrder });
  };

  return (
    <View className="flex-1 px-4 pt-3">
      <TasksHeader taskCount={tasks.length} onAddTask={() => sheetRef.current?.present({ projectId })} />

      {isLoading ? (
        <TasksLoadingState />
      ) : tasks.length > 0 ? (
        <DraggableFlatList
          testID="tasks-list"
          data={filteredTasks}
          keyExtractor={task => task.id}
          onDragEnd={onTasksDragEnd}
          renderItem={({ item: task, drag, isActive }: RenderItemParams<ITask>) => (
            <ScaleDecorator>
              <TaskListItem
                task={task}
                onEdit={editTask => sheetRef.current?.present({ task: editTask })}
                onToggleStatus={onToggleStatus}
                dragHandleProps={{ onLongPress: drag, disabled: isActive }}
              />
            </ScaleDecorator>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <Skeleton className="h-20 w-full rounded-xl" />
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 16 }}>
              <TaskQuickAdd projectId={projectId} />
              <TaskSearch value={searchQuery} onChange={setSearchQuery} />
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
              {debouncedSearch ? t('noResults.search') : t('noResults.filter')}
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

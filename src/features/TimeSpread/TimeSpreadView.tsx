import { type ITask } from '@nicoflow/shared/types';
import { Plus } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { FlatList, SectionList, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteTaskMutation, useGetTimeSpreadQuery, useScheduleTaskMutation, useUpdateTaskStatusMutation } from '@/lib/store';

import {
  EMPTY_COPY,
  groupByDay,
  nextStatus,
  type Segment,
  SEGMENTS,
  segmentToScheduledFor,
  selectSegmentTasks,
} from './segments';
import { SwipeableTaskRow } from './SwipeableTaskRow';
import { TaskCreateSheet, type TaskCreateSheetRef } from './TaskCreateSheet';
import { TaskEditSheet, type TaskEditSheetRef } from './TaskEditSheet';

const todayISO = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
};

export function TimeSpreadView() {
  const [segment, setSegment] = useState<Segment>('today');
  const { data, isLoading, isFetching, refetch } = useGetTimeSpreadQuery();
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const createSheetRef = useRef<TaskCreateSheetRef>(null);
  const editSheetRef = useRef<TaskEditSheetRef>(null);

  const tasks = selectSegmentTasks(segment, data);
  // isLoading only covers the very first request; a segment switch after that
  // is a refetch (same query, no args) so isFetching is what avoids showing
  // the previous segment's stale list while the new one loads (AC1).
  const showLoading = isLoading || isFetching;

  const weekGroups = useMemo(() => (segment === 'week' ? groupByDay(tasks) : []), [segment, tasks]);

  const handleToggleStatus = (task: ITask) => {
    void updateStatus({ id: task.id, status: nextStatus(task.status) });
  };

  const handleEdit = (task: ITask) => {
    editSheetRef.current?.present(task);
  };

  const handleScheduleToday = (task: ITask) => {
    void scheduleTask({ id: task.id, scheduledFor: todayISO() });
  };

  const handleScheduleTomorrow = (task: ITask) => {
    void scheduleTask({ id: task.id, scheduledFor: tomorrowISO() });
  };

  const handleUnschedule = (task: ITask) => {
    void scheduleTask({ id: task.id, scheduledFor: null });
  };

  const handleDelete = (task: ITask) => {
    void deleteTask(task.id);
  };

  const renderRow = (item: ITask) => (
    <SwipeableTaskRow
      task={item}
      segment={segment}
      onToggleStatus={handleToggleStatus}
      onEdit={handleEdit}
      onScheduleToday={handleScheduleToday}
      onScheduleTomorrow={handleScheduleTomorrow}
      onUnschedule={handleUnschedule}
      onDelete={handleDelete}
    />
  );

  const emptyState = (
    <View className="items-center justify-center py-12" testID="timespread-empty">
      <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
        {EMPTY_COPY[segment]}
      </Text>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="flex-1 gap-4 px-4 pt-4">
        <View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {SEGMENTS.find(s => s.key === segment)?.label}
          </Text>
        </View>

        <Tabs value={segment} onValueChange={value => setSegment(value as Segment)}>
          <TabsList>
            {SEGMENTS.map(s => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {segment === 'week' ? (
          <SectionList
            sections={showLoading ? [] : weekGroups.map(g => ({ title: g.label, key: g.key, data: g.tasks }))}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderSectionHeader={({ section }) => (
              <Text className="pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => <View className="pb-2">{renderRow(item)}</View>}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={showLoading ? null : emptyState}
          />
        ) : (
          <FlatList
            data={showLoading ? [] : tasks}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderItem={({ item }) => renderRow(item)}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={showLoading ? null : emptyState}
          />
        )}
      </View>

      <Button
        onPress={() => createSheetRef.current?.present(segmentToScheduledFor(segment))}
        className="absolute bottom-6 right-6 size-14 rounded-full"
        accessibilityLabel="New task">
        <Plus size={24} color="#ffffff" />
      </Button>

      <TaskCreateSheet ref={createSheetRef} onCreated={() => createSheetRef.current?.dismiss()} />
      <TaskEditSheet ref={editSheetRef} onUpdated={() => editSheetRef.current?.dismiss()} />
    </View>
  );
}

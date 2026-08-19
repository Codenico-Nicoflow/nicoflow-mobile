import type { ITask } from '@nicoflow/shared/types';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteTaskMutation, useGetTimeSpreadQuery, useUpdateTaskStatusMutation } from '@/lib/store';

import { EMPTY_COPY, nextStatus, type Segment, SEGMENTS, selectSegmentTasks } from './segments';
import { SwipeableTaskRow } from './SwipeableTaskRow';

export function TimeSpreadView() {
  const [segment, setSegment] = useState<Segment>('today');
  const { data, isLoading, isFetching, refetch } = useGetTimeSpreadQuery();
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const tasks = selectSegmentTasks(segment, data);
  // isLoading only covers the very first request; a segment switch after that
  // is a refetch (same query, no args) so isFetching is what avoids showing
  // the previous segment's stale list while the new one loads (AC1).
  const showLoading = isLoading || isFetching;

  const handleToggleStatus = (task: ITask) => {
    void updateStatus({ id: task.id, status: nextStatus(task.status) });
  };

  const handleDelete = (task: ITask) => {
    void deleteTask(task.id);
  };

  return (
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

      <FlatList
        data={showLoading ? [] : tasks}
        keyExtractor={item => item.id}
        contentContainerClassName="gap-2 pb-4"
        renderItem={({ item }) => (
          <SwipeableTaskRow task={item} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
        )}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        ListEmptyComponent={
          showLoading ? null : (
            <View className="items-center justify-center py-12" testID="timespread-empty">
              <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
                {EMPTY_COPY[segment]}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

import type { IBucket } from '@nicoflow/shared/types';
import { FlatList, Text, View } from 'react-native';

import { useDeleteBucketMutation, useGetBucketsQuery } from '@/lib/store';

import { BucketRow } from './BucketRow';
import { InboxCapture } from './InboxCapture';

export function InboxView() {
  const { data, isLoading, isFetching, refetch } = useGetBucketsQuery();
  const [deleteBucket] = useDeleteBucketMutation();

  const unprocessed = (data?.items ?? []).filter(b => !b.processedAt);

  const handleDelete = (bucket: IBucket) => {
    void deleteBucket(bucket.id);
  };

  return (
    <View className="flex-1 gap-4 px-4 pt-4">
      <InboxCapture />

      <FlatList
        data={isLoading ? [] : unprocessed}
        keyExtractor={item => item.id}
        contentContainerClassName="gap-2 pb-4"
        renderItem={({ item }) => <BucketRow bucket={item} onDelete={handleDelete} />}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center justify-center py-12" testID="inbox-empty">
              <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
                Inbox zero — nothing to process
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

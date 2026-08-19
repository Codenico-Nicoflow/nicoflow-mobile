import type { IBucket } from '@nicoflow/shared/types';
import { useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { type SheetRef } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteBucketMutation, useGetBucketsQuery } from '@/lib/store';

import { ArchivedList } from './ArchivedList';
import { BucketProcessSheet } from './BucketProcessSheet';
import { BucketRow } from './BucketRow';
import { InboxCapture } from './InboxCapture';

export function InboxView() {
  const { data, isLoading, isFetching, refetch } = useGetBucketsQuery();
  const [deleteBucket] = useDeleteBucketMutation();
  const [processingBucket, setProcessingBucket] = useState<IBucket | null>(null);
  const processSheetRef = useRef<SheetRef>(null);

  const items = data?.items ?? [];
  const unprocessed = items.filter(b => !b.processedAt);
  const archived = items.filter(b => !!b.processedAt);

  const handleDelete = (bucket: IBucket) => {
    void deleteBucket(bucket.id);
  };

  const handleOpenProcess = (bucket: IBucket) => {
    setProcessingBucket(bucket);
    processSheetRef.current?.present();
  };

  return (
    <View className="flex-1 gap-4 px-4 pt-4">
      <View>
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Inbox</Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {isLoading ? '' : unprocessed.length === 0 ? 'All clear' : `${unprocessed.length} to process`}
        </Text>
      </View>

      <Tabs defaultValue="inbox" className="flex-1">
        <TabsList>
          <TabsTrigger value="inbox">{isLoading ? 'Inbox' : `Inbox ${unprocessed.length}`}</TabsTrigger>
          <TabsTrigger value="archived">{isLoading ? 'Archived' : `Archived ${archived.length}`}</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="flex-1 gap-4">
          <InboxCapture />

          <FlatList
            data={isLoading ? [] : unprocessed}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderItem={({ item }) => <BucketRow bucket={item} onPress={handleOpenProcess} onDelete={handleDelete} />}
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
        </TabsContent>

        <TabsContent value="archived" className="flex-1">
          <ArchivedList items={archived} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <BucketProcessSheet
        ref={processSheetRef}
        bucket={processingBucket}
        onProcessed={() => processSheetRef.current?.dismiss()}
      />
    </View>
  );
}

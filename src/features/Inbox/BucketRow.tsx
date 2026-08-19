import type { IBucket } from '@nicoflow/shared/types';
import { Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { relativeTime } from './relativeTime';

function DeleteAction(_progress: SharedValue<number>, drag: SharedValue<number>) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value + 50 }] }));
  return (
    <Reanimated.View style={style} className="w-[50px] items-center justify-center bg-destructive dark:bg-destructive-dark rounded-xl">
      <Trash2 size={20} color="#ffffff" />
    </Reanimated.View>
  );
}

interface BucketRowProps {
  bucket: IBucket;
  onDelete: (bucket: IBucket) => void;
}

// Tap-to-open (the process bottom sheet) is NIC-1957's scope — this row is
// capture-and-list only for now.
export function BucketRow({ bucket, onDelete }: BucketRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      rightThreshold={64}
      renderRightActions={DeleteAction}
      onSwipeableOpen={() => onDelete(bucket)}>
      <View
        className="gap-1 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3"
        testID={`bucket-row-${bucket.id}`}>
        <Text className="text-sm text-foreground dark:text-foreground-dark" numberOfLines={2}>
          {bucket.content}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {relativeTime(bucket.createdAt)}
        </Text>
      </View>
    </ReanimatedSwipeable>
  );
}

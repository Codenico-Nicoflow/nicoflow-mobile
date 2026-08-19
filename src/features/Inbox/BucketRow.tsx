import type { IBucket } from '@nicoflow/shared/types';
import { Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, Text } from 'react-native';
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
  onPress: (bucket: IBucket) => void;
  onDelete: (bucket: IBucket) => void;
}

export function BucketRow({ bucket, onPress, onDelete }: BucketRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      rightThreshold={64}
      renderRightActions={DeleteAction}
      onSwipeableOpen={() => onDelete(bucket)}>
      <Pressable
        onPress={() => onPress(bucket)}
        accessibilityRole="button"
        className="gap-1 rounded-lg border border-border dark:border-border-dark border-l-4 border-l-primary/50 dark:border-l-primary-dark/50 bg-background/80 dark:bg-background-dark/80 px-3 py-2.5"
        testID={`bucket-row-${bucket.id}`}>
        <Text className="text-sm text-foreground dark:text-foreground-dark" numberOfLines={2}>
          {bucket.content}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {relativeTime(bucket.createdAt)}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

import { View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

export function NoteEditorSkeleton() {
  return (
    <View className="flex-1 gap-3 px-4 pt-3" testID="note-editor-loading">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-40 w-full rounded-md" />
    </View>
  );
}

import { useState } from 'react';
import { Image, type ImageProps, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

export function Avatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('relative size-8 shrink-0 overflow-hidden rounded-full', className)}>{children}</View>;
}

export function AvatarImage({ className, onError, ...props }: ImageProps & { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Image
      className={cn('aspect-square h-full w-full', className)}
      onError={e => {
        setFailed(true);
        onError?.(e);
      }}
      {...props}
    />
  );
}

export function AvatarFallback({ children, className }: { children: string; className?: string }) {
  return (
    <View className={cn('bg-muted dark:bg-muted-dark h-full w-full items-center justify-center rounded-full', className)}>
      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-medium">{children}</Text>
    </View>
  );
}

import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        'bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark py-6 gap-6 shadow-sm',
        className
      )}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('gap-2 px-6', className)}>{children}</View>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={cn('text-foreground dark:text-foreground-dark text-base font-semibold leading-none', className)}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={cn('text-muted-foreground dark:text-muted-foreground-dark text-sm', className)}>{children}</Text>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('px-6', className)}>{children}</View>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('flex-row items-center px-6', className)}>{children}</View>;
}

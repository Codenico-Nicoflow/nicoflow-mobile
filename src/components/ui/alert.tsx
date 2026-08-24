import { Text, View } from 'react-native';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

const alertVariants = cva('w-full rounded-lg border px-4 py-3', {
  variants: {
    variant: {
      default: 'bg-background dark:bg-background-dark border-border dark:border-border-dark',
      destructive: 'border-destructive/50 dark:border-destructive-dark bg-transparent',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  className?: string;
}

export function Alert({ children, variant, className }: AlertProps) {
  return <View className={cn(alertVariants({ variant }), className)}>{children}</View>;
}

export function AlertTitle({ children, variant }: { children: ReactNode; variant?: 'default' | 'destructive' | null }) {
  return (
    <Text
      className={cn(
        'font-medium text-sm mb-1',
        variant === 'destructive'
          ? 'text-destructive dark:text-destructive-dark'
          : 'text-foreground dark:text-foreground-dark'
      )}
    >
      {children}
    </Text>
  );
}

export function AlertDescription({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: 'default' | 'destructive' | null;
}) {
  return (
    <Text
      className={cn(
        'text-sm',
        variant === 'destructive'
          ? 'text-destructive dark:text-destructive-dark'
          : 'text-muted-foreground dark:text-muted-foreground-dark'
      )}
    >
      {children}
    </Text>
  );
}

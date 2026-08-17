import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('rounded-md border px-2 py-0.5 self-start', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary dark:bg-primary-dark',
      secondary: 'border-transparent bg-secondary dark:bg-secondary-dark',
      destructive: 'border-transparent bg-destructive dark:bg-destructive-dark',
      outline: 'border-border dark:border-border-dark',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground dark:text-secondary-foreground-dark',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground dark:text-foreground-dark',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={badgeTextVariants({ variant })}>{children}</Text>
    </View>
  );
}

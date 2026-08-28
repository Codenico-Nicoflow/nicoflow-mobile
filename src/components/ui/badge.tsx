import { type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('flex-row items-center gap-1 rounded-md border px-2 py-0.5 self-start', {
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
  icon?: ReactNode;
  className?: string;
  textClassName?: string;
  /** Overrides the variant's background — for semantic per-item colors (e.g. project status) that don't map to a fixed variant. */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ children, icon, variant, className, textClassName, style, textStyle }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} style={style}>
      {icon}
      <Text className={cn(badgeTextVariants({ variant }), textClassName)} style={textStyle}>
        {children}
      </Text>
    </View>
  );
}

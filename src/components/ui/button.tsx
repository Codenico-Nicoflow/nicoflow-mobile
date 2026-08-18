import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Ported from nicoflow-frontend's button.tsx variants — hover states dropped
// (no hover on touch), shadow-sm/md stays as the pressed-state swap
// (auth-button.tsx precedent), press-scale replaces the web transition.
const buttonVariants = cva('flex-row items-center justify-center gap-2 rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary dark:bg-primary-dark shadow-sm',
      destructive: 'bg-destructive dark:bg-destructive-dark shadow-sm',
      outline: 'border border-input dark:border-input-dark bg-background dark:bg-background-dark shadow-sm',
      secondary: 'bg-secondary dark:bg-secondary-dark shadow-sm',
      ghost: '',
      link: '',
    },
    size: {
      default: 'h-10 px-4',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      xl: 'h-11 px-14',
      icon: 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const textVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground dark:text-foreground-dark',
      secondary: 'text-secondary-foreground dark:text-secondary-foreground-dark',
      ghost: 'text-foreground dark:text-foreground-dark',
      link: 'text-primary dark:text-primary-dark underline',
    },
    size: {
      default: '',
      sm: '',
      lg: '',
      xl: '',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps extends Omit<PressableProps, 'children'>, VariantProps<typeof buttonVariants> {
  label?: string;
  children?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function Button({ label, children, loading, variant, size, disabled, className, onPressIn, onPressOut, ...props }: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = Boolean(loading || disabled);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={cn(buttonVariants({ variant, size }), isDisabled && 'opacity-50', className)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPressIn={e => {
        scale.set(withSpring(0.97, { damping: 15, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={e => {
        scale.set(withSpring(1, { damping: 15, stiffness: 400 }));
        onPressOut?.(e);
      }}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? undefined : '#ffffff'} />
      ) : label ? (
        <Text className={textVariants({ variant, size })}>{label}</Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

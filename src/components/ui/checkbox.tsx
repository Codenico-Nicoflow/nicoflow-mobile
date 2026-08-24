import { Pressable } from 'react-native';

import { Check } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/utils/cn';

const AnimatedCheck = Animated.createAnimatedComponent(Check);

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, disabled, className }: CheckboxProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(checked ? 1 : 0, { damping: 15, stiffness: 300 }),
    transform: [{ scale: withSpring(checked ? 1 : 0.4, { damping: 12, stiffness: 300 }) }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      className={cn(
        'size-4 shrink-0 items-center justify-center rounded border',
        checked
          ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
          : 'border-input dark:border-input-dark',
        disabled && 'opacity-50',
        className
      )}
    >
      <AnimatedCheck style={animatedStyle} size={12} color="#ffffff" strokeWidth={3} />
    </Pressable>
  );
}

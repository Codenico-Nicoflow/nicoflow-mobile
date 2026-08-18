import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  const scheme = useColorScheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn('rounded-md', scheme === 'dark' ? 'bg-accent-dark' : 'bg-accent', className)}
    />
  );
}

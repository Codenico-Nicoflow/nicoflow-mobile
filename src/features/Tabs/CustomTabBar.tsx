import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils/cn';

import { MOBILE_NAV_DESTINATIONS } from './data';

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const indicatorX = useSharedValue(0);
  const tabWidth = 100 / MOBILE_NAV_DESTINATIONS.length;

  useEffect(() => {
    indicatorX.set(withSpring(state.index * tabWidth, { damping: 18, stiffness: 220 }));
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorX.get()}%`,
  }));

  return (
    <View
      style={{ paddingBottom: insets.bottom }}
      className="flex-row border-t border-border dark:border-border-dark bg-background dark:bg-background-dark">
      <Animated.View
        style={[indicatorStyle, { width: `${tabWidth}%` }]}
        className="absolute top-0 h-0.5 bg-primary dark:bg-primary-dark"
      />
      {state.routes.map((route, index) => {
        const destination = MOBILE_NAV_DESTINATIONS.find(d => d.id === route.name);
        if (!destination) return null;

        const isFocused = state.index === index;
        const Icon = destination.icon;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={destination.label}
            className="flex-1 items-center gap-1 py-2">
            <Icon
              size={22}
              strokeWidth={isFocused ? 2.5 : 2}
              color={
                isFocused ? (isDark ? '#6366f1' : '#4f46e5') : isDark ? '#94a3b8' : '#64748b'
              }
            />
            <Text
              className={cn(
                'text-[11px]',
                isFocused ? 'text-primary dark:text-primary-dark font-medium' : 'text-muted-foreground dark:text-muted-foreground-dark'
              )}>
              {destination.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

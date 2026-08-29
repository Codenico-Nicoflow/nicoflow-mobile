import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, Text, useColorScheme, View } from 'react-native';

import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGetBucketsQuery, useGetTimeSpreadQuery } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import { MOBILE_NAV_DESTINATIONS } from './data';

// Matches web's Rail badge exactly: pill, 9+ cap, primary bg/white text,
// only rendered when count > 0 (see Rail/components/RailItem.tsx's Badge).
function TabBadge({ count }: { count: number }) {
  return (
    <View className="absolute -right-2.5 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-primary dark:bg-primary-dark px-1">
      <Text className="text-[10px] font-semibold text-primary-foreground">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const indicatorX = useSharedValue(0);
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / MOBILE_NAV_DESTINATIONS.length;

  // Same source as web's Rail: Today's count is what's scheduled for today,
  // Inbox's is unprocessed captures.
  const { data: timeSpread } = useGetTimeSpreadQuery();
  const todayCount = timeSpread?.today.length ?? 0;
  const { data: buckets } = useGetBucketsQuery();
  const inboxCount = buckets?.items.filter(b => !b.processedAt).length ?? 0;

  const badgeFor = (id: string) => {
    if (id === 'today') return todayCount;
    if (id === 'inbox') return inboxCount;
    return 0;
  };

  useEffect(() => {
    if (!tabWidth) return;
    indicatorX.set(withSpring(state.index * tabWidth, { damping: 22, stiffness: 320, mass: 0.5 }));
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={{ paddingBottom: insets.bottom }}
      className="flex-row border-t border-border dark:border-border-dark bg-background dark:bg-background-dark"
    >
      {tabWidth > 0 && (
        <Animated.View
          style={[indicatorStyle, { position: 'absolute', top: 0, left: 0, width: tabWidth }]}
          className="h-0.5 bg-primary dark:bg-primary-dark"
        />
      )}
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
            className="flex-1 items-center gap-1 py-2"
          >
            <View>
              <Icon
                size={22}
                strokeWidth={isFocused ? 2.5 : 2}
                color={isFocused ? (isDark ? '#6366f1' : '#4f46e5') : isDark ? '#94a3b8' : '#64748b'}
              />
              {badgeFor(destination.id) > 0 && <TabBadge count={badgeFor(destination.id)} />}
            </View>
            <Text
              className={cn(
                'text-[11px]',
                isFocused
                  ? 'text-primary dark:text-primary-dark font-medium'
                  : 'text-muted-foreground dark:text-muted-foreground-dark'
              )}
            >
              {destination.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

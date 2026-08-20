import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Shadows } from '@/constants/theme';
import { cn } from '@/lib/utils/cn';

import { dismissToast, subscribe, type ToastItem, type ToastVariant } from './store';

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_COLOR = (variant: ToastVariant, isDark: boolean): string => {
  const c = Colors[isDark ? 'dark' : 'light'];
  if (variant === 'success') return c.success;
  if (variant === 'error') return c.destructive;
  if (variant === 'warning') return c.destructive;
  return c.primary;
};

function ToastRow({ item }: { item: ToastItem }) {
  const isDark = useColorScheme() === 'dark';
  const c = Colors[isDark ? 'dark' : 'light'];
  const Icon = VARIANT_ICON[item.variant];
  const accent = VARIANT_COLOR(item.variant, isDark);

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(150)}
      // Matches sonner's --normal-bg/--normal-border tokens (Toaster/index.tsx
      // on web) — card surface, not a tinted variant background.
      style={[Shadows.md, { backgroundColor: c.card, borderColor: c.border }]}
      className="mb-2 flex-row items-start gap-2.5 rounded-lg border px-3.5 py-3"
      accessibilityRole="alert">
      <Icon size={18} color={accent} style={{ marginTop: 1 }} />
      <Text className="flex-1 text-sm" style={{ color: c.text }}>
        {item.message}
      </Text>
      {item.action && (
        <Pressable
          onPress={() => {
            item.action?.onPress();
            dismissToast(item.id);
          }}
          hitSlop={8}>
          <Text className="text-sm font-semibold" style={{ color: c.primary }}>
            {item.action.label}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={() => dismissToast(item.id)} hitSlop={8}>
        <X size={16} color={c.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Mount once at the app root (src/app/_layout.tsx). Renders above everything
 * else, top-anchored below the safe area — the RN equivalent of sonner's
 * <Toaster/> in Providers.tsx.
 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute inset-x-0 z-50 px-4')}
      style={{ top: insets.top + 8 }}>
      {items.map(item => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

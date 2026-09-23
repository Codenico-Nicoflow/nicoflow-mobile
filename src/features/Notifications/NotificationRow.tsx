import { Pressable, Text, useColorScheme, View } from 'react-native';

import { router } from 'expo-router';

import type { INotification } from '@nicoflow/shared/types';
import { Check, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { SwipeableRow } from '@/components/ui/swipeable-row';
import { relativeTime } from '@/features/Inbox/relativeTime';
import { resolveTapTarget } from '@/features/Push/tapRouting';

import { iconForType, styleForCategory } from './categoryStyle';

interface NotificationRowProps {
  notification: INotification;
  onMarkRead: (id: string) => void;
  /** Opens the delete confirm — swipe-to-delete always confirms, never fires directly. */
  onDelete: (notification: INotification) => void;
}

// One notification. Unread rows carry a category-coloured accent bar and
// full-weight text; read rows dim rather than disappear, since the point of this
// screen is seeing what you already missed.
//
// Tapping reuses resolveTapTarget — the same routing push notifications use — so
// a reminder or celebration deep-links to its entity and a digest or system
// notice, which has no single target, just marks itself read here.
export function NotificationRow({ notification, onMarkRead, onDelete }: NotificationRowProps) {
  const { t } = useTranslation('notification');
  const isDark = useColorScheme() === 'dark';

  const Icon = iconForType(notification.type);
  const style = styleForCategory(notification.category);
  const unread = !notification.isRead;

  const handlePress = () => {
    if (unread) onMarkRead(notification.id);
    const target = resolveTapTarget(notification);
    if (target.kind === 'deepLink') router.push(target.href);
  };

  return (
    <SwipeableRow
      className="rounded-lg border border-border dark:border-border-dark px-3 py-2.5"
      // Read rows dim rather than disappear — this screen exists to show what was
      // already missed, so they stay legible, just visibly settled.
      style={unread ? undefined : { opacity: 0.6 }}
      testID={`notification-row-${notification.id}`}
      right={{
        tone: 'destructive',
        icon: <Trash2 size={20} color="#ffffff" />,
        onPress: () => onDelete(notification),
        onOpen: () => onDelete(notification),
      }}
    >
      <View className="flex-row items-start gap-3">
        {unread && <View className={`w-[3px] self-stretch rounded-full ${style.accent}`} testID="unread-bar" />}

        <View className={`size-7 items-center justify-center rounded-full ${style.iconBg}`}>
          <Icon size={14} color={style.iconColor(isDark)} />
        </View>

        <Pressable onPress={handlePress} accessibilityRole="button" className="min-w-0 flex-1 gap-0.5">
          <Text
            className={`text-sm text-foreground dark:text-foreground-dark ${unread ? 'font-medium' : ''}`}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          {!!notification.body && (
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" numberOfLines={2}>
              {notification.body}
            </Text>
          )}
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {relativeTime(notification.createdAt)}
          </Text>
        </Pressable>

        {unread && (
          <Pressable
            onPress={() => onMarkRead(notification.id)}
            accessibilityRole="button"
            accessibilityLabel={t('panel.markRead')}
            hitSlop={8}
            className="size-8 items-center justify-center rounded-md"
            testID={`notification-mark-read-${notification.id}`}
          >
            <Check size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        )}
      </View>
    </SwipeableRow>
  );
}

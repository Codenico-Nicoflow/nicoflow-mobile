import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import type { IBucket } from '@nicoflow/shared/types';
import { Edit, MoreVertical, Trash2, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Reanimated, { FadeOutLeft } from 'react-native-reanimated';

import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { SwipeableRow } from '@/components/ui/swipeable-row';

import { relativeTime } from './relativeTime';

interface BucketRowProps {
  bucket: IBucket;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  /** Opens the delete confirm — swipe-to-delete always confirms, never fires directly. */
  onDelete: (bucket: IBucket) => void;
}

export function BucketRow({ bucket, onProcess, onEdit, onDelete }: BucketRowProps) {
  const { t } = useTranslation('bucket');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const menuRef = useRef<DropdownMenuRef>(null);

  return (
    <Reanimated.View exiting={FadeOutLeft.duration(220)}>
      <SwipeableRow
        className="rounded-lg border border-border dark:border-border-dark border-l-4 border-l-primary/50 dark:border-l-primary-dark/50 px-3 py-2.5"
        testID={`bucket-row-${bucket.id}`}
        right={{
          tone: 'destructive',
          icon: <Trash2 size={20} color="#ffffff" />,
          onPress: () => onDelete(bucket),
          onOpen: () => onDelete(bucket),
        }}
      >
        <View className="flex-row items-start gap-2">
          <Pressable onPress={() => onProcess(bucket)} accessibilityRole="button" className="flex-1 gap-1">
            <Text className="text-sm text-foreground dark:text-foreground-dark" numberOfLines={2}>
              {bucket.content}
            </Text>
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
              {relativeTime(bucket.createdAt)}
            </Text>
          </Pressable>

          <DropdownMenu
            ref={menuRef}
            trigger={
              <View className="size-8 items-center justify-center" testID={`bucket-row-menu-${bucket.id}`}>
                <MoreVertical size={18} color={mutedColor} />
              </View>
            }
          >
            <DropdownMenuItem
              icon={<Zap size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onProcess(bucket);
              }}
            >
              {t('actions.process')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Edit size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
              onPress={() => {
                menuRef.current?.dismiss();
                onEdit(bucket);
              }}
            >
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Trash2 size={16} color={isDark ? '#ef4444' : '#dc2626'} />}
              variant="destructive"
              onPress={() => {
                menuRef.current?.dismiss();
                onDelete(bucket);
              }}
            >
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenu>
        </View>
      </SwipeableRow>
    </Reanimated.View>
  );
}

import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import * as Haptics from 'expo-haptics';

import type { IBucket } from '@nicoflow/shared/types';
import { Edit, MoreVertical, Trash2, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  Easing,
  FadeOutLeft,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';

import { relativeTime } from './relativeTime';

const fireDeleteArmedHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// Mail-app-style reveal: the red panel fills the space the row vacates as it
// slides (not a fixed-width box translating in from off-screen), and the
// icon scales/fades in only once there's room for it — swiping a millimeter
// shouldn't pop a full-size icon into view. The row itself (below) fades and
// desaturates toward the same red as it drags, so the two layers read as one
// continuous color transition instead of a hard edge between a solid row and
// a solid panel.
interface DeleteActionProps {
  progress: SharedValue<number>;
  rowProgress: SharedValue<number>;
  onPress: () => void;
}

// A real component (not a bare closure) so useAnimatedReaction runs in a
// valid hook position — react-native-gesture-handler renders whatever
// renderRightActions returns as JSX, so this is a normal render, just
// triggered by the library rather than a parent's own tree.
//
// Both a full swipe-past-threshold (onSwipeableOpen, below) and a direct tap
// on this panel trigger delete — the earlier "stuck after first swipe" bug
// was never the auto-trigger itself, it was BucketDeleteAlert calling
// .dismiss() from both its own onDismiss prop AND a button handler, which
// double-fired the close animation and corrupted the sheet ref's present().
// Fixed there; this component no longer needs to work around it.
function DeleteAction({ progress, rowProgress, onPress }: DeleteActionProps) {
  // Mirrors this panel's progress into the row-owned shared value so the
  // front row (rendered outside renderRightActions' reach) can tint in
  // lockstep while dragging — the two would otherwise read as unrelated
  // layers with a hard seam between them. The moment progress starts
  // dropping (finger released, either closing back or fully deleting), the
  // mirror switches to one short fixed-duration fade straight to 0 instead
  // of continuing to track progress frame-by-frame — tracking the swipeable's
  // own native close spring visibly outlasted the panel sliding away, so the
  // tint read as a lagging red flash after the row had already closed.
  const isClosing = useSharedValue(false);
  useAnimatedReaction(
    () => progress.value,
    (value, previous) => {
      if (previous !== null && value < previous && !isClosing.value) {
        isClosing.value = true;
        rowProgress.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
      } else if (!isClosing.value) {
        rowProgress.value = value;
      }
      if (value === 0) isClosing.value = false;
    }
  );

  // The iOS Mail "armed" tick: a single haptic pulse the instant a swipe
  // crosses fully open (progress reaches 1), not a pulse on every frame
  // while dragging. previous starts null so the very first render — which
  // may already be at progress 1 if a swipe was mid-flight on mount — never
  // fires; only an actual 0→1 (or partial→1) crossing during this
  // component's life does.
  useAnimatedReaction(
    () => progress.value >= 1,
    (isArmed, wasArmed) => {
      if (isArmed && wasArmed === false) {
        scheduleOnRN(fireDeleteArmedHaptic);
      }
    }
  );

  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0.6, 1, 1]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.3, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 0.4, 1], [0.6, 0.8, 1]) }],
  }));

  return (
    <Reanimated.View style={panelStyle} className="w-20">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={8}
        className="flex-1 items-center justify-center bg-destructive dark:bg-destructive-dark rounded-lg"
      >
        <Reanimated.View style={iconStyle}>
          <Trash2 size={20} color="#ffffff" />
        </Reanimated.View>
      </Pressable>
    </Reanimated.View>
  );
}

interface BucketRowProps {
  bucket: IBucket;
  onProcess: (bucket: IBucket) => void;
  onEdit: (bucket: IBucket) => void;
  onDelete: (bucket: IBucket) => void;
}

export function BucketRow({ bucket, onProcess, onEdit, onDelete }: BucketRowProps) {
  const { t } = useTranslation('bucket');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const swipeableRef = useRef<SwipeableMethods>(null);
  const menuRef = useRef<DropdownMenuRef>(null);

  // Mirrored from renderRightActions' own progress SharedValue (the only
  // place ReanimatedSwipeable exposes it) into one owned at this level, so
  // the row content below can tint in lockstep with the reveal panel instead
  // of the two looking like unrelated layers with a hard seam between them.
  const rowProgress = useSharedValue(0);
  const renderRightActions = (progress: SharedValue<number>) => (
    <DeleteAction
      progress={progress}
      rowProgress={rowProgress}
      onPress={() => {
        onDelete(bucket);
        swipeableRef.current?.close();
      }}
    />
  );

  const rowTintStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      rowProgress.value,
      [0, 1],
      isDark ? ['rgba(17,26,46,0.8)', 'rgba(127,29,29,0.55)'] : ['rgba(255,255,255,0.8)', 'rgba(254,226,226,0.9)']
    ),
  }));

  return (
    <Reanimated.View exiting={FadeOutLeft.duration(220)}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={64}
        overshootRight={false}
        // Snappier than the library default spring — a slow close-back read
        // as the red panel/tint lingering after the finger had already let go.
        animationOptions={{ damping: 40, stiffness: 400 }}
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => {
          onDelete(bucket);
          swipeableRef.current?.close();
        }}
      >
        <Reanimated.View
          style={rowTintStyle}
          className="flex-row items-start gap-2 rounded-lg border border-border dark:border-border-dark border-l-4 border-l-primary/50 dark:border-l-primary-dark/50 px-3 py-2.5"
          testID={`bucket-row-${bucket.id}`}
        >
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
        </Reanimated.View>
      </ReanimatedSwipeable>
    </Reanimated.View>
  );
}

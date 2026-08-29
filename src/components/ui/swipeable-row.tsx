import { forwardRef, type ReactNode, useRef } from 'react';
import { Pressable, useColorScheme } from 'react-native';

import * as Haptics from 'expo-haptics';

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  Easing,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Extracted from BucketRow's original swipe-to-delete (Inbox) — the Mail-app
// reveal, color-transition, and "armed" haptic are now shared by every
// swipeable row in the app instead of re-implemented per feature. See
// TimeSpread's TaskRow (two-sided: complete + delete) and Inbox's BucketRow
// (one-sided: delete) for the two ways this gets used.

export type SwipeTone = 'success' | 'destructive';

const TONE_TINT_RGBA: Record<SwipeTone, { light: [string, string]; dark: [string, string] }> = {
  success: {
    light: ['rgba(255,255,255,0.8)', 'rgba(220,252,231,0.9)'],
    dark: ['rgba(17,26,46,0.8)', 'rgba(20,64,39,0.55)'],
  },
  destructive: {
    light: ['rgba(255,255,255,0.8)', 'rgba(254,226,226,0.9)'],
    dark: ['rgba(17,26,46,0.8)', 'rgba(127,29,29,0.55)'],
  },
};

const fireArmedHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

interface SwipeActionPanelProps {
  progress: SharedValue<number>;
  rowProgress: SharedValue<number>;
  activeTone: SharedValue<SwipeTone>;
  tone: SwipeTone;
  icon: ReactNode;
  onPress: () => void;
}

// A real component (not a bare closure) so useAnimatedReaction runs in a
// valid hook position — react-native-gesture-handler renders whatever
// renderLeftActions/renderRightActions returns as JSX, so this is a normal
// render, just triggered by the library rather than a parent's own tree.
function SwipeActionPanel({ progress, rowProgress, activeTone, tone, icon, onPress }: SwipeActionPanelProps) {
  const bgClass = tone === 'success' ? 'bg-success dark:bg-success-dark' : 'bg-destructive dark:bg-destructive-dark';

  // Mirrors this panel's progress into the row-owned shared value so the
  // front row (rendered outside renderLeftActions/renderRightActions' reach)
  // can tint in lockstep while dragging — the two would otherwise read as
  // unrelated layers with a hard seam between them. The moment progress
  // starts dropping (finger released, either closing back or fully firing),
  // the mirror switches to one short fixed-duration fade straight to 0
  // instead of continuing to track progress frame-by-frame — tracking the
  // swipeable's own native close spring visibly outlasted the panel sliding
  // away, so the tint read as a lagging flash after the row had already closed.
  //
  // activeTone is set HERE, inside the reaction (worklet, tied to this
  // panel's own progress actually leaving 0), not from the render-function
  // body — react-native-gesture-handler calls renderLeftActions/
  // renderRightActions during internal layout/measurement independent of
  // which side is actually being dragged, so setting activeTone at render
  // time picked whichever side rendered last, not the side in motion. That
  // was the bug behind the tint always showing one color regardless of
  // swipe direction.
  const isClosing = useSharedValue(false);
  useAnimatedReaction(
    () => progress.value,
    (value, previous) => {
      if (value > 0) activeTone.value = tone;
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
        scheduleOnRN(fireArmedHaptic);
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
        className={`flex-1 items-center justify-center rounded-lg ${bgClass}`}
      >
        <Reanimated.View style={iconStyle}>{icon}</Reanimated.View>
      </Pressable>
    </Reanimated.View>
  );
}

export interface SwipeSideConfig {
  tone: SwipeTone;
  icon: ReactNode;
  onPress: () => void;
  onOpen: () => void;
}

export interface SwipeableRowProps {
  children: ReactNode;
  className?: string;
  testID?: string;
  /** Swipe right to reveal — conventionally the affirmative action (e.g. complete). */
  left?: SwipeSideConfig;
  /** Swipe left to reveal — conventionally the destructive action (e.g. delete). */
  right?: SwipeSideConfig;
  /** True while a drag-reorder is holding this row — overrides the swipe tint with a vivid primary fill. */
  isDragging?: boolean;
}

export interface SwipeableRowHandle {
  close: () => void;
}

// Only one side can be open at a time, so a single rowProgress + a
// left-vs-right-active flag is enough to drive one shared tint — no need to
// track two independent colors simultaneously.
export const SwipeableRow = forwardRef<SwipeableRowHandle, SwipeableRowProps>(function SwipeableRow(
  { children, className, testID, left, right, isDragging },
  ref
) {
  const isDark = useColorScheme() === 'dark';
  const swipeableRef = useRef<SwipeableMethods>(null);
  const rowProgress = useSharedValue(0);
  const activeTone = useSharedValue<SwipeTone>('destructive');

  if (ref && typeof ref === 'object') {
    ref.current = { close: () => swipeableRef.current?.close() };
  }

  const renderLeftActions = left
    ? (progress: SharedValue<number>) => (
        <SwipeActionPanel
          progress={progress}
          rowProgress={rowProgress}
          activeTone={activeTone}
          tone={left.tone}
          icon={left.icon}
          onPress={() => {
            left.onPress();
            swipeableRef.current?.close();
          }}
        />
      )
    : undefined;

  const renderRightActions = right
    ? (progress: SharedValue<number>) => (
        <SwipeActionPanel
          progress={progress}
          rowProgress={rowProgress}
          activeTone={activeTone}
          tone={right.tone}
          icon={right.icon}
          onPress={() => {
            right.onPress();
            swipeableRef.current?.close();
          }}
        />
      )
    : undefined;

  const dragTint = isDark ? 'rgba(99,102,241,0.3)' : 'rgba(79,70,229,0.25)';
  const rowTintStyle = useAnimatedStyle(() => {
    if (isDragging) return { backgroundColor: dragTint };
    const tone = activeTone.value;
    const [from, to] = isDark ? TONE_TINT_RGBA[tone].dark : TONE_TINT_RGBA[tone].light;
    return { backgroundColor: interpolateColor(rowProgress.value, [0, 1], [from, to]) };
  }, [isDragging, isDark]);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={left ? 64 : undefined}
      rightThreshold={right ? 64 : undefined}
      overshootLeft={false}
      overshootRight={false}
      // Snappier than the library default spring — a slow close-back read as
      // the tint/panel lingering after the finger had already let go.
      animationOptions={{ damping: 40, stiffness: 400 }}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      // Confirmed empirically (not from docs, which describe this
      // ambiguously): `direction` here is the direction of the drag
      // gesture itself, not which action panel ended up visible. Dragging
      // right-to-left (revealing the RIGHT panel, renderRightActions) fires
      // direction === 'left'; dragging left-to-right (revealing the LEFT
      // panel) fires direction === 'right'. So the mapping to which
      // config's onOpen fires is the OPPOSITE of the panel it names.
      onSwipeableOpen={direction => {
        if (direction === 'left' && right) right.onOpen();
        if (direction === 'right' && left) left.onOpen();
      }}
    >
      <Reanimated.View style={rowTintStyle} className={className} testID={testID}>
        {children}
      </Reanimated.View>
    </ReanimatedSwipeable>
  );
});

import * as Haptics from 'expo-haptics';

import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Completing a task should feel earned, not instant. Checking it off holds
// the row visible with a success flash + scale pulse, THEN scales/fades out
// and only fires the real mutation once the hold finishes — the list reflow
// (row removal/reorder) never happens before the user has seen the "done".
// Un-completing (DONE -> ACTIVE) always fires immediately, no hold: the
// celebration is one-directional, same as web's completion guard.
const HOLD_MS = 500;
const FLASH_MS = 150;
const EXIT_MS = 220;

export function useCompletionCelebration(onComplete: () => void) {
  const flash = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const trigger = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    flash.value = withSequence(
      withTiming(1, { duration: FLASH_MS, easing: Easing.out(Easing.quad) }),
      withDelay(HOLD_MS - FLASH_MS * 2, withTiming(0, { duration: FLASH_MS }))
    );
    scale.value = withSequence(
      withTiming(1.03, { duration: FLASH_MS, easing: Easing.out(Easing.quad) }),
      withDelay(HOLD_MS - FLASH_MS * 2, withTiming(0.9, { duration: EXIT_MS, easing: Easing.in(Easing.quad) }))
    );
    opacity.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: EXIT_MS }, finished => {
        if (finished) runOnJS(onComplete)();
      })
    );
  };

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  return { trigger, celebrationStyle, flashStyle };
}

export const AnimatedCelebrationOverlay = Animated.View;

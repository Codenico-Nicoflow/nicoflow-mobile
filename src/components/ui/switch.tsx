import { Pressable, useColorScheme } from 'react-native';

import Animated, { interpolateColor, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

export function Switch({ checked, onCheckedChange, disabled, testID }: SwitchProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const primary = isDark ? '#6366f1' : '#4f46e5';
  const input = isDark ? '#283549' : '#e2e8f0';

  // withTiming returns an animation object, not a number, so it may only be the
  // value a style property is set to. Feeding it into interpolateColor passes an
  // object where a number is required, which throws on the UI thread and takes
  // the whole app down — animate the interpolated colour instead.
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(interpolateColor(checked ? 1 : 0, [0, 1], [input, primary]), { duration: 150 }),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(checked ? 16 : 2, { duration: 150 }) }],
  }));

  return (
    <Pressable
      testID={testID}
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[{ height: 20, width: 36, borderRadius: 999, justifyContent: 'center' }, trackStyle]}>
        <Animated.View style={[{ height: 16, width: 16, borderRadius: 999, backgroundColor: '#ffffff' }, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

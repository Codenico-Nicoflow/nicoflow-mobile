import { Pressable, useColorScheme } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const primary = isDark ? '#6366f1' : '#4f46e5';
  const input = isDark ? '#283549' : '#e2e8f0';

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(withTiming(checked ? 1 : 0, { duration: 150 }), [0, 1], [input, primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(checked ? 16 : 2, { duration: 150 }) }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}>
      <Animated.View
        style={[{ height: 20, width: 36, borderRadius: 999, justifyContent: 'center' }, trackStyle]}>
        <Animated.View
          style={[{ height: 16, width: 16, borderRadius: 999, backgroundColor: '#ffffff' }, thumbStyle]}
        />
      </Animated.View>
    </Pressable>
  );
}

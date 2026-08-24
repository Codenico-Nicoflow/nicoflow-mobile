import { useState } from 'react';
import { Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface InputProps extends Omit<TextInputProps, 'placeholder'> {
  label: string;
  error?: string;
}

const CONTAINER_HEIGHT = 56;
const REST_FONT_SIZE = 16;
const RAISED_FONT_SIZE = 12;
// Where the label's baseline sits once raised — measured up from the
// container's vertical center, clearing the input text below it entirely
// rather than straddling the border like a naively-scaled center label does.
const RAISED_OFFSET = 15;

// Floating label: sits at placeholder height/size when empty+unfocused,
// animates to a shrunk raised position above the input text on focus or
// has-value — matches nicoflow-frontend's Input treatment plus the design
// doc's animation spec (§6), which web's CSS-only floating label can't do
// natively so this is genuinely mobile-native motion, not a port.
export function Input({ label, error, value, onFocus, onBlur, style, ...props }: InputProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value);
  const raised = focused || hasValue;

  const focusProgress = useSharedValue(raised ? 1 : 0);
  const shakeX = useSharedValue(0);
  const labelProgress = useSharedValue(raised ? 1 : 0);

  const borderColor = isDark ? '#283549' : '#e2e8f0';
  const ringColor = isDark ? '#6366f1' : '#4f46e5';
  const destructiveColor = isDark ? '#ef4444' : '#dc2626';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -labelProgress.get() * RAISED_OFFSET },
      { scale: 1 - labelProgress.get() * (1 - RAISED_FONT_SIZE / REST_FONT_SIZE) },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.get(),
      [0, 1],
      [error ? destructiveColor : borderColor, error ? destructiveColor : ringColor]
    ),
    borderWidth: withTiming(focused ? 1.5 : 1, { duration: 150 }),
    transform: [{ translateX: shakeX.get() }],
  }));

  const triggerShake = () => {
    shakeX.set(
      withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 40 }),
        withTiming(0, { duration: 40 })
      )
    );
  };

  return (
    <View className="gap-1">
      <Animated.View
        style={[
          borderStyle,
          { height: CONTAINER_HEIGHT, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
        ]}
        className="bg-card dark:bg-card-dark"
      >
        <Animated.Text
          style={[
            animatedLabelStyle,
            {
              position: 'absolute',
              left: 14,
              color: error ? destructiveColor : mutedColor,
              fontSize: REST_FONT_SIZE,
            },
          ]}
          pointerEvents="none"
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <TextInput
          value={value}
          accessibilityLabel={label}
          style={[
            { fontSize: REST_FONT_SIZE, marginTop: raised ? 9 : 0, color: isDark ? '#e2e8f0' : '#0f172a' },
            style,
          ]}
          onFocus={e => {
            setFocused(true);
            focusProgress.set(withTiming(1, { duration: 150 }));
            labelProgress.set(withTiming(1, { duration: 150 }));
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            focusProgress.set(withTiming(0, { duration: 150 }));
            labelProgress.set(withTiming(value ? 1 : 0, { duration: 150 }));
            if (error) triggerShake();
            onBlur?.(e);
          }}
          {...props}
        />
      </Animated.View>
      {error && <Text className="text-destructive dark:text-destructive-dark text-[13px]">{error}</Text>}
    </View>
  );
}

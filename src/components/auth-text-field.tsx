import { useState } from 'react';

import { StyleSheet, Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

interface AuthTextFieldProps extends TextInputProps {
  error?: string;
}

// Mirrors nicoflow-frontend's Input: h-9 (36px), shadow-xs at rest,
// border-input token, focus ring (web's focus-visible:ring-ring/50
// ring-[3px] — RN has no native focus-visible, so onFocus/onBlur drive an
// explicit ring color swap + shadow bump instead).
export function AuthTextField({ error, style, onFocus, onBlur, ...props }: AuthTextFieldProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.ring : colors.inputBorder;

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[
          styles.input,
          { borderColor, backgroundColor: colors.card, color: colors.text },
          Shadows.xs,
          focused && !error && { borderWidth: 1.5 },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.half },
  input: { height: 36, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.three, fontSize: 15 },
  error: { fontSize: 13 },
});

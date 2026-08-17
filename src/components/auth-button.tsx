import { useState } from 'react';

import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// Mirrors nicoflow-frontend's Button (default variant, size="xl"): shadow-sm
// at rest, shadow-md on hover/press, 44px height, 200ms transition. RN has no
// CSS transitions for shadow, so press state swaps the static shadow token
// instead of animating between them — visually equivalent at this scale.
export function AuthButton({ label, onPress, loading, disabled }: AuthButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDisabled = Boolean(loading || disabled);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        pressed ? Shadows.md : Shadows.sm,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}>
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text style={[styles.label, { color: colors.primaryForeground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
});

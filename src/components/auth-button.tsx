import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthButton({ label, onPress, loading, disabled }: AuthButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDisabled = Boolean(loading || disabled);

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.primary }, isDisabled && styles.disabled]}
      onPress={onPress}
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
  button: { borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.two },
  disabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600' },
});

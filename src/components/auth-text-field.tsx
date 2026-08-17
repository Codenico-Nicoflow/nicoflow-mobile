import { StyleSheet, Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

interface AuthTextFieldProps extends TextInputProps {
  error?: string;
}

export function AuthTextField({ error, style, ...props }: AuthTextFieldProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[
          styles.input,
          { borderColor: error ? colors.destructive : colors.border, backgroundColor: colors.card, color: colors.text },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.half },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: Spacing.three, fontSize: 16 },
  error: { fontSize: 13 },
});

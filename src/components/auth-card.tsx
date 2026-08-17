import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

// Mirrors nicoflow-frontend's SignForm (src/features/SignForm/SignForm.tsx):
// title + subtitle header, content below. The outer page chrome (logo
// header, scroll, footer, safe area) lives in (auth)/_layout.tsx now — this
// only owns the form card itself.
export function AuthCard({ title, description, children }: AuthCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: MaxContentWidth * 0.5 },
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.five },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  description: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
});

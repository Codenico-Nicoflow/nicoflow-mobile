import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

// Mirrors nicoflow-frontend's SignForm (src/features/SignForm/SignForm.tsx):
// centered header, title + subtitle, content card below. Shared by all three
// auth screens so they read as one product with web, not three one-offs.
export function AuthCard({ title, description, children }: AuthCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  card: { width: '100%', maxWidth: MaxContentWidth * 0.5 },
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.five },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  description: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
});

import { Link, Slot } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Colors, Spacing } from '@/constants/theme';

// Mirrors nicoflow-frontend's AuthLayout (src/layout/AuthLayout.tsx) mobile
// treatment — the desktop split hero panel is `lg:`-only there, so mobile
// always gets what web calls the "right form panel": logo header, centered
// form, footer. A bare centered card with nothing else on screen (the
// previous version of this file) reads as broken, not minimal.
export default function AuthLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Link href="/sign-in">
            <Logo size={24} />
          </Link>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Slot />
        </ScrollView>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © {new Date().getFullYear()} Nicoflow
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: Spacing.four, paddingBottom: Spacing.one },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.six,
    padding: Spacing.four,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  footerText: { fontSize: 12 },
});

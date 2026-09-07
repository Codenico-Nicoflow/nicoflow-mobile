import { useColorScheme, View } from 'react-native';

import { Stack } from 'expo-router';

import { type LucideIcon } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';

interface SectionPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Landing shell for the four More sections until each gets its real screen
// (AI/Search/Settings/Notifications, later E-037 stories). Carries the same
// local SafeAreaProvider + per-screen header override as app/project/[id]:
// these routes live outside (tabs), where native-stack isolates the view
// hierarchy from the root providers and the global headerShown:false would
// otherwise leave no way back.
export function SectionPlaceholder({ icon, title, description }: SectionPlaceholderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: title,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: isDark ? '#0b1120' : '#f8fafc' },
          headerTintColor: isDark ? '#e2e8f0' : '#0f172a',
          headerShadowVisible: false,
        }}
      />
      <View style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
          <EmptyState icon={icon} title={title} description={description} testID="more-section-placeholder" />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

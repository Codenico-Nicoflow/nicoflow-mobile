import { useLocalSearchParams } from 'expo-router';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AIChat } from '@/features/AI/AIChat';

// One conversation. Needs its own SafeAreaProvider for the same native-stack
// isolation reason as the other non-(tabs) routes.
export default function AIChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <AIChat sessionId={id} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

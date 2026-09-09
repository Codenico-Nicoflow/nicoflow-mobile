import { useState } from 'react';
import { Text, View } from 'react-native';

import { router } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { toast } from '@/components/ui/toast';
import { AISessionList } from '@/features/AI/AISessionList';
import { useCreateAISessionMutation } from '@/lib/store';

// Conversations list. Non-(tabs) routes are isolated in their own native view
// hierarchy, so this needs its own SafeAreaProvider or SafeAreaView collapses
// to 0 height — same fix as note/[id].tsx.
export default function AIScreen() {
  const { t } = useTranslation('ai');
  const [createSession, { isLoading: isCreating }] = useCreateAISessionMutation();
  const [activeId, setActiveId] = useState<string | undefined>();

  const openSession = (id: string) => {
    setActiveId(id);
    router.push(`/ai/${id}`);
  };

  const handleCreate = async () => {
    try {
      const session = await createSession({}).unwrap();
      openSession(session.id);
    } catch {
      toast.error(t('sessions.loadErrorTitle'));
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <View className="px-3 py-3">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">{t('page.heading')}</Text>
        </View>

        <AISessionList
          activeId={activeId}
          onSelect={openSession}
          onCreate={() => void handleCreate()}
          isCreating={isCreating}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

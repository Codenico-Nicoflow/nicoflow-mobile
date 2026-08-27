import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { NoteEditorPage } from '@/features/Notes/page/NoteEditorPage';

// react-native-screens' native-stack isolates each top-level (non-tab-group)
// route into its own native view hierarchy — the root SafeAreaProvider
// (app/_layout.tsx) doesn't bridge across that boundary, so screens outside
// (tabs) need their own local provider or SafeAreaView collapses to 0 height.
// Same fix as app/project/[id].tsx.
export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <NoteEditorPage noteId={id} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

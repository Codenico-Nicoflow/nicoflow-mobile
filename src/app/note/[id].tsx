import { KeyboardAvoidingView, Platform } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteEditorPage } from '@/features/Notes/page/NoteEditorPage';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <NoteEditorPage noteId={id} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

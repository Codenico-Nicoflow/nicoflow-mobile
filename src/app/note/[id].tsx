import { useLocalSearchParams } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder shell — the real editor (rich-text body, autosave, backlinks,
// delete flow) is NIC-1984, gated on the WebView-Tiptap spike (NIC-1982).
// This route exists now so NIC-1983's create/open flow has somewhere to
// navigate to, same pattern as app/project/[id].tsx preceding ProjectView.
export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" testID={`note-screen-${id}`} />;
}

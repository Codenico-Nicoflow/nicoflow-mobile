import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { type TiptapDoc } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { useLazySearchMentionsQuery } from '@/lib/store';

import { type NoteEditorState, NoteEditorWebView, type NoteEditorWebViewRef } from './NoteEditorWebView';
import { NoteToolbar } from './NoteToolbar';

export interface NoteEditorProps {
  content: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  editable?: boolean;
  onContentError?: () => void;
  excludeNoteId?: string;
}

// Composite: native toolbar + the WebView-Tiptap surface, matching web's
// NoteEditor.tsx shape (toolbar only renders when editable). Content flows
// in/out as TiptapDoc JSON, same contract as web — no HTML round-trip.
//
// @-mention typeahead: the query and the result list both live here in RN,
// not inside the WebView (see editorHtml.ts's NoteMention node comment for
// why — no space for a WebView-hosted popover next to the on-screen
// keyboard). The WebView posts 'mentionQuery'/'mentionExit' as the user
// types; this debounces a searchMentions call and renders a native list
// above the toolbar; tapping a row calls back into the WebView to insert.
export function NoteEditor({ content, onChange, editable = true, onContentError, excludeNoteId }: NoteEditorProps) {
  const { t } = useTranslation('notes');
  const webviewRef = useRef<NoteEditorWebViewRef>(null);
  const [state, setState] = useState<NoteEditorState | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [searchMentions, { data: mentionResults }] = useLazySearchMentionsQuery();

  useEffect(() => {
    if (mentionQuery === null) return;
    const handle = setTimeout(() => {
      void searchMentions({ q: mentionQuery, excludeId: excludeNoteId });
    }, 250);
    return () => clearTimeout(handle);
  }, [mentionQuery, excludeNoteId, searchMentions]);

  useEffect(() => {
    if (mentionResults && mentionQuery !== null) {
      webviewRef.current?.resolveMentionQuery(mentionResults);
    }
  }, [mentionResults, mentionQuery]);

  return (
    <View
      style={{ flex: 1 }}
      className="rounded-md border border-input dark:border-input-dark overflow-hidden"
      accessibilityLabel={t('editor.label')}
    >
      {editable && <NoteToolbar state={state} onCommand={cmd => webviewRef.current?.dispatch(cmd)} />}

      {mentionQuery !== null && (
        <View
          className="border-b border-border dark:border-border-dark bg-background dark:bg-background-dark"
          testID="note-mention-list"
        >
          {!mentionResults || mentionResults.length === 0 ? (
            <Text className="px-3 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {/* TODO(NIC-1972): swap to t('editor.mentionEmpty') once @nicoflow/shared publishes the
                  mentionEmpty key (nicoflow-shared PR #70) and this repo bumps its dependency. */}
              No notes found
            </Text>
          ) : (
            <FlatList
              data={mentionResults}
              keyExtractor={item => item.id}
              style={{ maxHeight: 160 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    webviewRef.current?.insertMention(item.id, item.title);
                    setMentionQuery(null);
                  }}
                  accessibilityRole="button"
                  testID={`note-mention-suggestion-${item.id}`}
                  className="px-3 py-2 active:bg-accent dark:active:bg-accent-dark"
                >
                  <Text className="text-sm text-foreground dark:text-foreground-dark" numberOfLines={1}>
                    {item.title}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      <NoteEditorWebView
        ref={webviewRef}
        content={content}
        editable={editable}
        placeholder={t('editor.placeholder')}
        onChange={onChange}
        onContentError={() => onContentError?.()}
        onStateChange={setState}
        onMentionQuery={query => setMentionQuery(query)}
        onMentionExit={() => setMentionQuery(null)}
      />
    </View>
  );
}

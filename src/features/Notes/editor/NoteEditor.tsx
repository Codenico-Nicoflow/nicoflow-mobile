import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { type TiptapDoc } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { useLazySearchMentionsQuery } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import { CALLOUT_ICON_COMPONENTS } from './calloutIconComponents';
import { NOTE_CALLOUT_ICONS } from './calloutIcons';
import { CALLOUT_SWATCH, NOTE_COLOR_TOKENS } from './colorTokens';
import { type NoteEditorState, NoteEditorWebView, type NoteEditorWebViewRef } from './NoteEditorWebView';
import { NoteToolbar } from './NoteToolbar';

export interface NoteEditorProps {
  content: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  editable?: boolean;
  onContentError?: () => void;
  excludeNoteId?: string;
  onMentionTapped?: (noteId: string) => void;
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
export function NoteEditor({
  content,
  onChange,
  editable = true,
  onContentError,
  excludeNoteId,
  onMentionTapped,
}: NoteEditorProps) {
  const { t } = useTranslation('notes');
  const webviewRef = useRef<NoteEditorWebViewRef>(null);
  const [state, setState] = useState<NoteEditorState | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [searchMentions, { data: mentionResults }] = useLazySearchMentionsQuery();

  // Editing an ALREADY-INSERTED callout's icon/color — distinct from
  // NoteToolbar's insert-time sheet. Tapping the icon/color button rendered
  // on the callout node itself (webview-assets/editorHtml.ts) posts its
  // ProseMirror position here; the position round-trips back on selection so
  // the WebView knows exactly which node to update, even if the user has
  // scrolled or the doc has multiple callouts.
  const calloutIconSheetRef = useRef<SheetRef>(null);
  const calloutColorSheetRef = useRef<SheetRef>(null);
  const [calloutTargetPos, setCalloutTargetPos] = useState<number | null>(null);

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
              {t('editor.mentionEmpty')}
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
        onMentionTapped={noteId => onMentionTapped?.(noteId)}
        onCalloutIconTapped={pos => {
          setCalloutTargetPos(pos);
          calloutIconSheetRef.current?.present();
        }}
        onCalloutColorTapped={pos => {
          setCalloutTargetPos(pos);
          calloutColorSheetRef.current?.present();
        }}
      />

      {/* Edit an existing callout's icon — opened by tapping the icon on the
          node itself, not the toolbar's insert flow. */}
      <Sheet ref={calloutIconSheetRef} snapPoints={['45%']}>
        <SheetHeader>
          {/* TODO: swap to t('toolbar.calloutIconTitle') once @nicoflow/shared
              publishes it and this repo bumps its dependency. */}
          <SheetTitle>Callout icon</SheetTitle>
        </SheetHeader>
        <View className="flex-row flex-wrap gap-2">
          {NOTE_CALLOUT_ICONS.map(icon => {
            const Icon = CALLOUT_ICON_COMPONENTS[icon];
            return (
              <Pressable
                key={icon}
                onPress={() => {
                  if (calloutTargetPos !== null) webviewRef.current?.setCalloutIconAt(calloutTargetPos, icon);
                  calloutIconSheetRef.current?.dismiss();
                }}
                accessibilityRole="button"
                testID={`note-callout-icon-${icon}`}
                className="size-11 items-center justify-center rounded-md border border-input dark:border-input-dark"
              >
                <Icon size={20} className="text-foreground dark:text-foreground-dark" />
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      {/* Edit an existing callout's color — same tap-to-apply pattern. */}
      <Sheet ref={calloutColorSheetRef} snapPoints={['35%']}>
        <SheetHeader>
          {/* TODO: swap to t('toolbar.calloutColorTitle') once @nicoflow/shared
              publishes it and this repo bumps its dependency. */}
          <SheetTitle>Callout color</SheetTitle>
        </SheetHeader>
        <View className="flex-row flex-wrap gap-2">
          {NOTE_COLOR_TOKENS.map(token => (
            <Pressable
              key={token}
              onPress={() => {
                if (calloutTargetPos !== null) webviewRef.current?.setCalloutColorAt(calloutTargetPos, token);
                calloutColorSheetRef.current?.dismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={token}
              testID={`note-callout-color-${token}`}
              className={cn('size-8 rounded-full border-2 border-transparent')}
              style={{ backgroundColor: CALLOUT_SWATCH[token] }}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

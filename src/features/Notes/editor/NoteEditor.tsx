import { useRef, useState } from 'react';
import { View } from 'react-native';

import { type TiptapDoc } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { type NoteEditorState, NoteEditorWebView, type NoteEditorWebViewRef } from './NoteEditorWebView';
import { NoteToolbar } from './NoteToolbar';

export interface NoteEditorProps {
  content: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  editable?: boolean;
  onContentError?: () => void;
}

// Composite: native toolbar + the WebView-Tiptap surface, matching web's
// NoteEditor.tsx shape (toolbar only renders when editable). Content flows
// in/out as TiptapDoc JSON, same contract as web — no HTML round-trip.
export function NoteEditor({ content, onChange, editable = true, onContentError }: NoteEditorProps) {
  const { t } = useTranslation('notes');
  const webviewRef = useRef<NoteEditorWebViewRef>(null);
  const [state, setState] = useState<NoteEditorState | null>(null);

  return (
    <View
      className="flex-1 rounded-md border border-input dark:border-input-dark overflow-hidden"
      accessibilityLabel={t('editor.label')}
    >
      {editable && <NoteToolbar state={state} onCommand={cmd => webviewRef.current?.dispatch(cmd)} />}
      <NoteEditorWebView
        ref={webviewRef}
        content={content}
        editable={editable}
        placeholder={t('editor.placeholder')}
        onChange={onChange}
        onContentError={() => onContentError?.()}
        onStateChange={setState}
      />
    </View>
  );
}

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { type TiptapDoc } from '@nicoflow/shared/types';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { Colors } from '@/constants/theme';

import { buildEditorHtml } from './webview-assets/editorHtml';
import { NOTE_HIGHLIGHT_COLORS, NOTE_TEXT_COLORS } from './colorTokens';

export interface NoteEditorState {
  isBold: boolean;
  isItalic: boolean;
  isHeading1: boolean;
  isHeading2: boolean;
  isHeading3: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isTaskList: boolean;
  isCodeBlock: boolean;
  isTable: boolean;
  isCallout: boolean;
  isDateMention: boolean;
  isLink: boolean;
  textColorToken: string | null;
  highlightToken: string | null;
}

export type NoteEditorCommand =
  | { type: 'toggleBold' }
  | { type: 'toggleItalic' }
  | { type: 'toggleHeading'; level: 1 | 2 | 3 }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'toggleTaskList' }
  | { type: 'toggleCodeBlock' }
  | { type: 'insertTable' }
  | { type: 'setCallout'; icon: string; colorToken: string }
  | { type: 'setHorizontalRule' }
  | { type: 'setLink'; href: string }
  | { type: 'unsetLink' }
  | { type: 'setDateMention'; date: string }
  | { type: 'setTextColor'; token: string }
  | { type: 'unsetTextColor' }
  | { type: 'setHighlight'; token: string }
  | { type: 'unsetHighlight' }
  | { type: 'addColumnBefore' }
  | { type: 'addColumnAfter' }
  | { type: 'deleteColumn' }
  | { type: 'addRowBefore' }
  | { type: 'addRowAfter' }
  | { type: 'deleteRow' }
  | { type: 'toggleHeaderRow' }
  | { type: 'mergeOrSplit' }
  | { type: 'deleteTable' };

export interface NoteEditorWebViewRef {
  dispatch: (command: NoteEditorCommand) => void;
  setEditable: (editable: boolean) => void;
}

interface NoteEditorWebViewProps {
  content: TiptapDoc;
  editable: boolean;
  placeholder: string;
  onChange: (content: TiptapDoc) => void;
  onContentError: () => void;
  onStateChange: (state: NoteEditorState) => void;
}

// The RN half of the WebView-Tiptap bridge (NIC-1982 decision). This
// component owns the WebView instance and translates native toolbar taps
// into postMessage commands understood by webview-assets/editorHtml.ts —
// it never touches Tiptap itself. Content/state flow back via onMessage.
export const NoteEditorWebView = forwardRef<NoteEditorWebViewRef, NoteEditorWebViewProps>(function NoteEditorWebView(
  { content, editable, placeholder, onChange, onContentError, onStateChange },
  ref
) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const webviewRef = useRef<WebView>(null);

  const send = (payload: Record<string, unknown>) => {
    webviewRef.current?.injectJavaScript(`window.__dispatch(${JSON.stringify(payload)}); true;`);
  };

  useImperativeHandle(ref, () => ({
    dispatch: command => send(command),
    setEditable: nextEditable => send({ type: 'setEditable', editable: nextEditable }),
  }));

  const html = buildEditorHtml({
    fg: theme.text,
    muted: theme.textSecondary,
    border: theme.border,
    codeBg: theme.backgroundElement,
    link: theme.primary,
  });

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { type: string; content?: TiptapDoc; state?: NoteEditorState };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (msg.type === 'domReady') {
      send({
        type: 'load',
        content,
        editable,
        placeholder,
        textPalette: isDark ? NOTE_TEXT_COLORS.dark : NOTE_TEXT_COLORS.light,
        highlightPalette: isDark ? NOTE_HIGHLIGHT_COLORS.dark : NOTE_HIGHLIGHT_COLORS.light,
      });
      return;
    }
    if (msg.type === 'change' && msg.content) {
      onChange(msg.content);
      return;
    }
    if (msg.type === 'contentError') {
      onContentError();
      return;
    }
    if (msg.type === 'state' && msg.state) {
      onStateChange(msg.state);
    }
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      onMessage={onMessage}
      originWhitelist={['*']}
      style={{ backgroundColor: 'transparent' }}
      scrollEnabled
      hideKeyboardAccessoryView
      keyboardDisplayRequiresUserAction={false}
      testID="note-editor-webview"
    />
  );
});

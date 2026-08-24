// The WebView shell hosting a real Tiptap instance (NIC-1982 decision:
// WebView-Tiptap, not a native RN rich-text library — see the Confluence
// decision doc under E-036). This is the ONLY place that talks to Tiptap;
// everything else in the app (autosave, conflict, toolbar buttons) talks to
// THIS shell over postMessage, never to Tiptap directly.
//
// Self-contained single HTML string (not a separate .html + .js pair):
// react-native-webview's `source={{ html }}` has no filesystem to resolve a
// relative `<script src>` against, so the module script is inlined here and
// Tiptap itself is loaded from esm.sh by absolute URL (a real network
// request, which works regardless of how the surrounding HTML was loaded).
//
// Schema mirrors nicoflow-frontend's createNoteExtensions() (extensions.ts)
// node-for-node: StarterKit (heading/bold/italic/lists/code block/blockquote/
// hr/link — link ships INSIDE StarterKit in Tiptap v3), TableKit, TaskItem
// (non-nestable)+TaskList, textColor/highlight marks, callout node,
// dateMention node. Node/mark/attribute names below are dictated by the
// backend's content allowlist (nicoflow-api content.go) — do not rename
// without updating that allowlist first, same rule web's source comments
// state.
//
// Deliberately absent: the @-mention node (NoteMentionNode). It is not one
// of the 17 toolbar controls named in NIC-1984's AC7 list — it's a separate
// "@"-triggered typeahead feature layered on top of the toolbar, wired to a
// live backend search endpoint. Out of scope for this story; the schema slot
// for it is additive whenever it lands.
export const TIPTAP_VERSION = '3.29.2';

const NOTE_COLOR_TOKENS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];
const NOTE_CALLOUT_ICONS = ['info', 'warning', 'success', 'idea', 'star', 'note', 'flag', 'question'];

const CALLOUT_GLYPH: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  idea: '💡',
  star: '⭐',
  note: '📝',
  flag: '🚩',
  question: '❓',
};

export function buildEditorHtml(themeColors: {
  fg: string;
  muted: string;
  border: string;
  codeBg: string;
  link: string;
}): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, system-ui, sans-serif;
    color: ${themeColors.fg};
    font-size: 15px;
    line-height: 1.6;
    -webkit-user-select: text;
  }
  #editor { padding: 4px 2px 32px; min-height: 50vh; outline: none; }
  .ProseMirror { outline: none; }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: ${themeColors.muted};
    pointer-events: none;
    height: 0;
  }
  .ProseMirror h1 { font-size: 1.6em; font-weight: 700; margin: 0.6em 0 0.3em; }
  .ProseMirror h2 { font-size: 1.3em; font-weight: 700; margin: 0.6em 0 0.3em; }
  .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.3em; }
  .ProseMirror p { margin: 0.4em 0; }
  .ProseMirror ul, .ProseMirror ol { padding-left: 1.4em; margin: 0.4em 0; }
  .ProseMirror pre {
    background: ${themeColors.codeBg};
    border-radius: 6px;
    padding: 10px 12px;
    overflow-x: auto;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }
  .ProseMirror blockquote {
    border-left: 3px solid ${themeColors.border};
    margin: 0.4em 0;
    padding-left: 0.8em;
    color: ${themeColors.muted};
  }
  .ProseMirror hr { border: none; border-top: 1px solid ${themeColors.border}; margin: 1em 0; }
  .ProseMirror a { color: ${themeColors.link}; text-decoration: underline; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
  ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; margin: 0.3em 0; }
  ul[data-type="taskList"] li > label { margin-top: 0.15em; }
  ul[data-type="taskList"] li > div { flex: 1; }
  ul[data-type="taskList"] input[type="checkbox"] { width: 16px; height: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
  table td, table th {
    border: 1px solid ${themeColors.border};
    padding: 6px 8px;
    min-width: 60px;
    vertical-align: top;
  }
  table th { background: ${themeColors.codeBg}; font-weight: 600; }
  div[data-note-callout] {
    display: flex;
    gap: 8px;
    border: 1px solid ${themeColors.border};
    border-radius: 8px;
    padding: 10px 12px;
    margin: 0.5em 0;
    align-items: flex-start;
  }
  div[data-note-callout] > .callout-icon { flex-shrink: 0; font-size: 1.1em; line-height: 1.5; }
  div[data-note-callout] > .callout-body { flex: 1; min-width: 0; }
  span[data-note-date-mention] {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid ${themeColors.border};
    background: ${themeColors.codeBg};
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 0.9em;
  }
  mark[data-note-highlight] { border-radius: 3px; padding: 0 2px; }
  span[data-note-text-color] { color: inherit; }
</style>
</head>
<body>
<div id="editor"></div>
<script type="module">
import { Editor, Node, Mark, mergeAttributes } from 'https://esm.sh/@tiptap/core@${TIPTAP_VERSION}';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@${TIPTAP_VERSION}';
import { TableKit } from 'https://esm.sh/@tiptap/extension-table@${TIPTAP_VERSION}?deps=@tiptap/core@${TIPTAP_VERSION}';
import TaskItem from 'https://esm.sh/@tiptap/extension-task-item@${TIPTAP_VERSION}?deps=@tiptap/core@${TIPTAP_VERSION}';
import TaskList from 'https://esm.sh/@tiptap/extension-task-list@${TIPTAP_VERSION}?deps=@tiptap/core@${TIPTAP_VERSION}';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@${TIPTAP_VERSION}?deps=@tiptap/core@${TIPTAP_VERSION}';

const NOTE_COLOR_TOKENS = ${JSON.stringify(NOTE_COLOR_TOKENS)};
const NOTE_CALLOUT_ICONS = ${JSON.stringify(NOTE_CALLOUT_ICONS)};
const CALLOUT_GLYPH = ${JSON.stringify(CALLOUT_GLYPH)};
const ALLOWED_LINK_PROTOCOLS = ['http', 'https', 'mailto'];

const isToken = (v) => typeof v === 'string' && NOTE_COLOR_TOKENS.includes(v);
const isIcon = (v) => typeof v === 'string' && NOTE_CALLOUT_ICONS.includes(v);
const isAllowedLinkProtocol = (url) =>
  ALLOWED_LINK_PROTOCOLS.some((p) => url.toLowerCase().startsWith(p + ':'));

// Mirrors web's NoteTextColor/NoteHighlight (colorMarks.ts): a token-name
// attribute, never a computed color, resolved at render via inline style
// here (web resolves via CSS custom property + data-token; this WebView has
// no shared stylesheet with the host app's theme tokens, so it resolves
// directly to the hex passed in from RN at construction time).
function makeColorMark(name, tag, dataAttr, extraAttr, palette, cssProp) {
  return Mark.create({
    name,
    addAttributes() {
      return {
        color: {
          default: null,
          parseHTML: (el) => (isToken(el.getAttribute(dataAttr)) ? el.getAttribute(dataAttr) : null),
          renderHTML: (attrs) => {
            const token = isToken(attrs.color) ? attrs.color : null;
            if (!token) return {};
            const out = { [dataAttr]: token };
            if (palette[token]) out.style = cssProp + ':' + palette[token];
            return out;
          },
        },
      };
    },
    parseHTML() {
      return [{ tag: tag + '[' + dataAttr + ']' }];
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes, { [extraAttr]: '' }), 0];
    },
  });
}

// Mirrors web's NoteCallout (CalloutNode.tsx): block node, icon+colorToken
// attrs from the same fixed allowlists. No React node view here — this is a
// bare DOM node view (Tiptap core's NodeView interface) rendering the icon
// glyph + editable body; icon/color changes come from RN via postMessage
// (native pickers), not an in-WebView popover.
const NoteCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      icon: {
        default: 'info',
        parseHTML: (el) => (isIcon(el.getAttribute('data-icon')) ? el.getAttribute('data-icon') : 'info'),
        renderHTML: (attrs) => ({ 'data-icon': isIcon(attrs.icon) ? attrs.icon : 'info' }),
      },
      colorToken: {
        default: 'blue',
        parseHTML: (el) => (isToken(el.getAttribute('data-token')) ? el.getAttribute('data-token') : 'blue'),
        renderHTML: (attrs) => ({ 'data-token': isToken(attrs.colorToken) ? attrs.colorToken : 'blue' }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-note-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-note-callout': '' }), 0];
  },
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement('div');
      Object.entries(mergeAttributes(HTMLAttributes, { 'data-note-callout': '' })).forEach(([k, v]) =>
        dom.setAttribute(k, v)
      );
      const iconEl = document.createElement('span');
      iconEl.className = 'callout-icon';
      iconEl.contentEditable = 'false';
      iconEl.textContent = CALLOUT_GLYPH[node.attrs.icon] || CALLOUT_GLYPH.info;
      const contentEl = document.createElement('div');
      contentEl.className = 'callout-body';
      dom.appendChild(iconEl);
      dom.appendChild(contentEl);
      return {
        dom,
        contentDOM: contentEl,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          iconEl.textContent = CALLOUT_GLYPH[updatedNode.attrs.icon] || CALLOUT_GLYPH.info;
          return true;
        },
      };
    };
  },
  addCommands() {
    return {
      setNoteCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { icon: attrs.icon || 'info', colorToken: attrs.colorToken || 'blue' },
            content: [{ type: 'paragraph' }],
          }),
      updateNoteCalloutAttrs:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
    };
  },
});

// Mirrors web's NoteDateMention (DateMentionNode.tsx): atomic inline node,
// display-only (does not create a Task, does not link Calendar/Time-Spread —
// same v1 scope as web). Date picked via RN's native DateField, sent in over
// the bridge as a 'setDateMention' command carrying the ISO date.
const NoteDateMention = Node.create({
  name: 'dateMention',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-date'),
        renderHTML: (attrs) => ({ 'data-date': attrs.date }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-note-date-mention]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-note-date-mention': '' }), formatDateLabel(HTMLAttributes['data-date'])];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-note-date-mention', '');
      dom.setAttribute('data-date', node.attrs.date || '');
      dom.contentEditable = 'false';
      dom.textContent = formatDateLabel(node.attrs.date);
      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          dom.setAttribute('data-date', updatedNode.attrs.date || '');
          dom.textContent = formatDateLabel(updatedNode.attrs.date);
          return true;
        },
      };
    };
  },
  addCommands() {
    return {
      setNoteDateMention:
        (isoDate) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { date: isoDate } }),
    };
  },
});

function formatDateLabel(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const TEXT_PALETTE = {};
const HIGHLIGHT_PALETTE = {};
window.__setColorPalettes = (text, highlight) => {
  Object.assign(TEXT_PALETTE, text);
  Object.assign(HIGHLIGHT_PALETTE, highlight);
};

const NoteTextColor = makeColorMark('textColor', 'span', 'data-token', 'data-note-text-color', TEXT_PALETTE, 'color');
const NoteHighlight = makeColorMark(
  'highlight',
  'mark',
  'data-token',
  'data-note-highlight',
  HIGHLIGHT_PALETTE,
  'background-color'
);

let editor = null;
let lastEmittedJSON = null;

function post(message) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
}

function withEditableBody(doc) {
  if (doc && Array.isArray(doc.content) && doc.content.length > 0) return doc;
  return Object.assign({}, doc, { content: [{ type: 'paragraph' }] });
}

function createEditor(content, editable, placeholder) {
  if (editor) {
    editor.destroy();
    editor = null;
  }
  let contentCheckFailed = false;
  editor = new Editor({
    element: document.querySelector('#editor'),
    extensions: [
      StarterKit.configure({
        link: {
          protocols: ALLOWED_LINK_PROTOCOLS,
          isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && !url.startsWith('//'),
          shouldAutoLink: isAllowedLinkProtocol,
          openOnClick: false,
        },
      }),
      TableKit.configure({ table: { resizable: false } }),
      TaskItem.configure({ nested: false }),
      TaskList,
      NoteTextColor,
      NoteHighlight,
      NoteCallout,
      NoteDateMention,
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: withEditableBody(content),
    editable,
    enableContentCheck: true,
    onContentError: () => {
      contentCheckFailed = true;
      post({ type: 'contentError' });
    },
    onUpdate: ({ editor: instance }) => {
      if (contentCheckFailed) return;
      const json = instance.getJSON();
      lastEmittedJSON = json;
      post({ type: 'change', content: json });
    },
    onCreate: () => {
      post({ type: 'ready' });
    },
  });
}

// Bridge protocol (native RN -> WebView). RN drives this via
// webviewRef.injectJavaScript(\`window.__dispatch(\${JSON.stringify(msg)})\`) —
// a direct function call, not a synthetic 'message' event (react-native-webview's
// postMessage->window.addEventListener('message') path is documented for
// WebView->RN; the RN->WebView direction is documented as injectJavaScript,
// so this mirrors that rather than mixing both patterns). Every toolbar
// action and lifecycle event is one of these messages — this is the ONLY way
// the native side talks to Tiptap, matching the decision doc's "native
// toolbar posts command messages" architecture.
window.__dispatch = function (msg) {
  if (!editor && msg.type !== 'load') return;

  switch (msg.type) {
    case 'load':
      window.__setColorPalettes(msg.textPalette || {}, msg.highlightPalette || {});
      createEditor(msg.content, msg.editable !== false, msg.placeholder);
      break;
    case 'setEditable':
      editor.setEditable(!!msg.editable);
      break;
    case 'toggleBold':
      editor.chain().focus().toggleBold().run();
      break;
    case 'toggleItalic':
      editor.chain().focus().toggleItalic().run();
      break;
    case 'toggleHeading':
      editor.chain().focus().toggleHeading({ level: msg.level }).run();
      break;
    case 'toggleBulletList':
      editor.chain().focus().toggleBulletList().run();
      break;
    case 'toggleOrderedList':
      editor.chain().focus().toggleOrderedList().run();
      break;
    case 'toggleTaskList':
      editor.chain().focus().toggleTaskList().run();
      break;
    case 'toggleCodeBlock':
      editor.chain().focus().toggleCodeBlock().run();
      break;
    case 'insertTable':
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      break;
    case 'setCallout':
      editor.chain().focus().setNoteCallout({ icon: msg.icon, colorToken: msg.colorToken }).run();
      break;
    case 'setHorizontalRule':
      editor.chain().focus().setHorizontalRule().run();
      break;
    case 'setLink':
      editor.chain().focus().extendMarkRange('link').setLink({ href: msg.href }).run();
      break;
    case 'unsetLink':
      editor.chain().focus().unsetLink().run();
      break;
    case 'setDateMention':
      editor.chain().focus().setNoteDateMention(msg.date).run();
      break;
    case 'setTextColor':
      editor.chain().focus().setMark('textColor', { color: msg.token }).run();
      break;
    case 'unsetTextColor':
      editor.chain().focus().unsetMark('textColor').run();
      break;
    case 'setHighlight':
      editor.chain().focus().setMark('highlight', { color: msg.token }).run();
      break;
    case 'unsetHighlight':
      editor.chain().focus().unsetMark('highlight').run();
      break;
    case 'addColumnBefore':
      editor.chain().focus().addColumnBefore().run();
      break;
    case 'addColumnAfter':
      editor.chain().focus().addColumnAfter().run();
      break;
    case 'deleteColumn':
      editor.chain().focus().deleteColumn().run();
      break;
    case 'addRowBefore':
      editor.chain().focus().addRowBefore().run();
      break;
    case 'addRowAfter':
      editor.chain().focus().addRowAfter().run();
      break;
    case 'deleteRow':
      editor.chain().focus().deleteRow().run();
      break;
    case 'toggleHeaderRow':
      editor.chain().focus().toggleHeaderRow().run();
      break;
    case 'mergeOrSplit':
      editor.chain().focus().mergeOrSplit().run();
      break;
    case 'deleteTable':
      editor.chain().focus().deleteTable().run();
      break;
    case 'requestState':
      emitState();
      break;
    default:
      break;
  }
  if (editor) emitState();
};

// Active-mark/node state, polled by RN after every command + selection
// change, so the native toolbar can show pressed states (bold active, inside
// a table, etc.) without re-implementing Tiptap's own state machine.
function emitState() {
  if (!editor) return;
  post({
    type: 'state',
    state: {
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      isHeading1: editor.isActive('heading', { level: 1 }),
      isHeading2: editor.isActive('heading', { level: 2 }),
      isHeading3: editor.isActive('heading', { level: 3 }),
      isBulletList: editor.isActive('bulletList'),
      isOrderedList: editor.isActive('orderedList'),
      isTaskList: editor.isActive('taskList'),
      isCodeBlock: editor.isActive('codeBlock'),
      isTable: editor.isActive('table'),
      isCallout: editor.isActive('callout'),
      isDateMention: editor.isActive('dateMention'),
      isLink: editor.isActive('link'),
      textColorToken: editor.getAttributes('textColor').color || null,
      highlightToken: editor.getAttributes('highlight').color || null,
    },
  });
}

document.addEventListener('selectionchange', () => {
  if (editor) emitState();
});

post({ type: 'domReady' });
</script>
</body>
</html>`;
}

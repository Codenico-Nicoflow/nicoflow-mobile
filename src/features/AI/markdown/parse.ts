// Minimal markdown model for assistant output. Deliberately small: this parses
// untrusted LLM text, so the safest renderer is one whose whole grammar fits on
// a page. react-markdown is DOM-only and can't be reused here.
//
// Security properties, mirroring web's markdown.tsx (E-026/E-027 Security table,
// NIC-1756) — these are load-bearing, not styling:
//   1. Raw HTML is never interpreted. There is no HTML branch in this grammar at
//      all, and RN <Text> renders strings literally, so `<script>` in model
//      output is visible text and can never become a node.
//   2. Images are dropped. `![alt](url)` is stripped to its alt text — a
//      markdown image would otherwise fire a GET on render, the classic
//      LLM-chat exfiltration channel.
//   3. Links carry only http(s) hrefs. Any other scheme (javascript:, data:,
//      file:, intent:) degrades to plain text, so nothing dangerous is ever
//      handed to Linking.openURL.

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: number; children: InlineNode[] }
  | { type: 'listItem'; ordered: boolean; marker: string; children: InlineNode[] }
  | { type: 'codeBlock'; value: string }
  | { type: 'blockquote'; children: InlineNode[] };

// Only http/https survive as links. Checked on the raw href before any use.
const SAFE_HREF = /^https?:\/\//i;

export const isSafeHref = (href: string): boolean => SAFE_HREF.test(href.trim());

// Images first so their alt text is kept but the URL is discarded entirely.
const IMAGE = /!\[([^\]]*)\]\((?:[^()\s]|\([^()]*\))*\)/g;

// The href alternative allows one level of balanced parens so a URL like
// `javascript:alert(1)` or a Wikipedia `(disambiguation)` link is consumed
// whole — otherwise the closing paren leaks out as stray literal text.
const INLINE = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))+)\)/;

const stripImages = (text: string): string => text.replace(IMAGE, (_match, alt: string) => alt);

// parseInline walks the string left-to-right, emitting a text node for anything
// between matches. Unmatched syntax is left as literal text rather than throwing.
export const parseInline = (raw: string): InlineNode[] => {
  const source = stripImages(raw);
  const nodes: InlineNode[] = [];
  let rest = source;

  for (;;) {
    const match = INLINE.exec(rest);
    if (!match || match.index === undefined) break;

    if (match.index > 0) nodes.push({ type: 'text', value: rest.slice(0, match.index) });

    const [full, , strong, , em, code, linkText, href] = match;
    if (strong !== undefined) nodes.push({ type: 'strong', value: strong });
    else if (em !== undefined) nodes.push({ type: 'em', value: em });
    else if (code !== undefined) nodes.push({ type: 'code', value: code });
    else if (href !== undefined) {
      // An unsafe scheme degrades to the link's visible text — never a tappable
      // node, so the URL can't reach Linking.openURL.
      if (isSafeHref(href)) nodes.push({ type: 'link', value: linkText || href, href: href.trim() });
      else nodes.push({ type: 'text', value: linkText || '' });
    }

    rest = rest.slice(match.index + full.length);
  }

  if (rest) nodes.push({ type: 'text', value: rest });
  return nodes.length > 0 ? nodes : [{ type: 'text', value: '' }];
};

const HEADING = /^(#{1,6})\s+(.*)$/;
const UNORDERED = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/;
const BLOCKQUOTE = /^>\s?(.*)$/;
const FENCE = /^```/;

// parseMarkdown splits into block nodes. Fenced code is captured verbatim (never
// re-parsed for inline syntax) so code samples render as written.
export const parseMarkdown = (source: string): BlockNode[] => {
  const blocks: BlockNode[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'paragraph', children: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FENCE.test(line)) {
      flushParagraph();
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
      blocks.push({ type: 'codeBlock', value: body.join('\n') });
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, children: parseInline(heading[2]) });
      continue;
    }

    const quote = BLOCKQUOTE.exec(line);
    if (quote) {
      flushParagraph();
      blocks.push({ type: 'blockquote', children: parseInline(quote[1]) });
      continue;
    }

    const ordered = ORDERED.exec(line);
    if (ordered) {
      flushParagraph();
      blocks.push({ type: 'listItem', ordered: true, marker: `${ordered[1]}.`, children: parseInline(ordered[2]) });
      continue;
    }

    const unordered = UNORDERED.exec(line);
    if (unordered) {
      flushParagraph();
      blocks.push({ type: 'listItem', ordered: false, marker: '•', children: parseInline(unordered[1]) });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
};

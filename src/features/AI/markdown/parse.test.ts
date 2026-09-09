import { isSafeHref, parseInline, parseMarkdown } from './parse';

describe('isSafeHref', () => {
  it.each(['http://a.test', 'https://a.test', 'HTTPS://A.TEST'])('accepts %s', href => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'intent://evil',
    '//evil.test',
  ])('rejects %s', href => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe('parseInline security', () => {
  it('strips an image to its alt text so no request is ever fired', () => {
    expect(parseInline('before ![leak](https://evil.test/pixel.png) after')).toEqual([
      { type: 'text', value: 'before leak after' },
    ]);
  });

  it('drops the url of an image with empty alt text', () => {
    const nodes = parseInline('![](https://evil.test/pixel.png)');
    expect(JSON.stringify(nodes)).not.toContain('evil.test');
  });

  it('degrades a javascript: link to plain text, never a link node', () => {
    expect(parseInline('[click me](javascript:alert(1))')).toEqual([{ type: 'text', value: 'click me' }]);
  });

  it('degrades a data: link to plain text', () => {
    const nodes = parseInline('[x](data:text/html,<script>alert(1)</script>)');
    expect(nodes.some(n => n.type === 'link')).toBe(false);
  });

  it('keeps an http(s) link as a link node', () => {
    expect(parseInline('[docs](https://nicoflow.app)')).toEqual([
      { type: 'link', value: 'docs', href: 'https://nicoflow.app' },
    ]);
  });

  it('treats raw html as literal text, never markup', () => {
    const nodes = parseInline('<script>alert(1)</script>');
    expect(nodes).toEqual([{ type: 'text', value: '<script>alert(1)</script>' }]);
  });
});

describe('parseInline formatting', () => {
  it('parses bold, italic and inline code', () => {
    expect(parseInline('**b** *i* `c`')).toEqual([
      { type: 'strong', value: 'b' },
      { type: 'text', value: ' ' },
      { type: 'em', value: 'i' },
      { type: 'text', value: ' ' },
      { type: 'code', value: 'c' },
    ]);
  });

  it('leaves unmatched syntax as literal text', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([{ type: 'text', value: '2 * 3 = 6' }]);
  });
});

describe('parseMarkdown blocks', () => {
  it('parses headings with their level', () => {
    expect(parseMarkdown('## Title')).toEqual([
      { type: 'heading', level: 2, children: [{ type: 'text', value: 'Title' }] },
    ]);
  });

  it('captures fenced code verbatim without inline parsing', () => {
    expect(parseMarkdown('```\nconst a = **not bold**;\n```')).toEqual([
      { type: 'codeBlock', value: 'const a = **not bold**;' },
    ]);
  });

  it('parses unordered and ordered list items', () => {
    const blocks = parseMarkdown('- one\n2. two');
    expect(blocks).toEqual([
      { type: 'listItem', ordered: false, marker: '•', children: [{ type: 'text', value: 'one' }] },
      { type: 'listItem', ordered: true, marker: '2.', children: [{ type: 'text', value: 'two' }] },
    ]);
  });

  it('joins wrapped lines into one paragraph and splits on a blank line', () => {
    const blocks = parseMarkdown('one\ntwo\n\nthree');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: 'paragraph', children: [{ type: 'text', value: 'one two' }] });
  });

  it('parses a blockquote', () => {
    expect(parseMarkdown('> quoted')).toEqual([{ type: 'blockquote', children: [{ type: 'text', value: 'quoted' }] }]);
  });

  it('returns no blocks for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});

import { Fragment, type ReactNode } from 'react';
import { Text } from 'react-native';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Splits `text` into segments, wrapping every case-insensitive occurrence of any
// query word in a tinted <Text> so the matched part reads back to the user.
// Mirrors web's highlightMatch — RN has no <mark>, so the emphasis is a nested
// Text with a primary-tinted background. Query words are escaped so regex
// metacharacters are treated literally.
export const highlightMatch = (text: string, query: string): ReactNode => {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(escapeRegExp);

  if (words.length === 0) return text;

  // Capture group → split keeps the delimiters; matched slices land at odd
  // indices, so parity (not a stateful .test) tells us what to mark. Empty
  // strings from split are kept so parity stays intact; they render nothing.
  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} className="bg-primary/15 text-foreground dark:text-foreground-dark">
        {part}
      </Text>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
};

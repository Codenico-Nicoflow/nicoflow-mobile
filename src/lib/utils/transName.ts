// Several shared i18n delete-confirmation strings (area/project/task/note)
// wrap the interpolated entity name in `<name>...</name>` for react-i18next's
// web-only <Trans> component to bold. Mobile doesn't wire up <Trans> (it maps
// awkwardly onto RN's <Text> children model), so this splits the already-
// interpolated string into plain segments the caller renders as two <Text>
// nodes instead — same visual bolding, no DOM-oriented dependency.
export interface SplitTransName {
  before: string;
  name: string;
  after: string;
}

export function splitTransName(interpolated: string): SplitTransName {
  const match = /^(.*)<name>(.*)<\/name>(.*)$/s.exec(interpolated);
  if (!match) return { before: interpolated, name: '', after: '' };
  const [, before, name, after] = match;
  return { before, name, after };
}

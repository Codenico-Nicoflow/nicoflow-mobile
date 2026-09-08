import { useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';

import type { ISearchResults } from '@nicoflow/shared/api';
import { Search as SearchIcon, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchQuery } from '@/lib/store';

import { SearchResultRow } from './SearchResultRow';
import { MAX_RESULTS, MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS, type SearchSelectPayload } from './types';
import { useSearchNavigation } from './useSearchNavigation';

type Section = { kind: SearchSelectPayload['kind']; titleKey: string; data: SearchSelectPayload[] };

// Builds the section list from the response. Every group in ISearchResults is
// mapped here — `notes` is an additive group (E-054) and a UI that forgets it
// drops results silently, so this is driven off the response shape rather than
// a hand-written list of three.
const buildSections = (data: ISearchResults | undefined): Section[] => {
  if (!data) return [];

  const sections: Section[] = [
    { kind: 'task', titleKey: 'search.groupTasks', data: (data.tasks ?? []).map(item => ({ kind: 'task', item })) },
    {
      kind: 'project',
      titleKey: 'search.groupProjects',
      data: (data.projects ?? []).map(item => ({ kind: 'project', item })),
    },
    { kind: 'area', titleKey: 'search.groupAreas', data: (data.areas ?? []).map(item => ({ kind: 'area', item })) },
    { kind: 'note', titleKey: 'search.groupNotes', data: (data.notes ?? []).map(item => ({ kind: 'note', item })) },
  ];

  return sections.filter(section => section.data.length > 0);
};

const titleOf = (payload: SearchSelectPayload): string =>
  payload.kind === 'task' || payload.kind === 'note' ? payload.item.title : payload.item.name;

// The secondary line. A note's projectName is an EMPTY STRING when the note is
// orphaned (its project was deleted) — never null — so fall back on truthiness,
// not a null check, and show the excerpt instead.
const metaOf = (payload: SearchSelectPayload): string | undefined => {
  if (payload.kind === 'task') return payload.item.projectName || undefined;
  if (payload.kind === 'project') return payload.item.areaName || undefined;
  if (payload.kind === 'note') return payload.item.projectName || payload.item.excerpt || undefined;
  return undefined;
};

export function SearchScreen() {
  const { t } = useTranslation('common');
  const navigateToResult = useSearchNavigation();
  const [inputValue, setInputValue] = useState('');
  const debouncedQ = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  const trimmed = debouncedQ.trim();
  const isQueryReady = trimmed.length >= MIN_QUERY_LENGTH;
  const isEmpty = inputValue.trim().length === 0;

  const { data, isFetching } = useSearchQuery(trimmed, { skip: !isQueryReady });

  const sections = useMemo(() => buildSections(data), [data]);
  const hasAnyResult = sections.length > 0;

  return (
    <View className="flex-1" testID="search-screen">
      <View className="px-3 pb-2">
        <Input
          value={inputValue}
          onChangeText={setInputValue}
          label={t('search.placeholder')}
          accessibilityLabel={t('search.placeholder')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          testID="search-input"
        />
      </View>

      {isEmpty && (
        <EmptyState
          icon={Sparkles}
          title={t('search.hintTitle')}
          description={t('search.hintBody')}
          testID="search-hint"
        />
      )}

      {/* Skeleton rows, never a blank screen — and never stale results while a
          new query is in flight. */}
      {!isEmpty && isQueryReady && isFetching && (
        <View className="gap-2 px-3" testID="search-loading">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </View>
      )}

      {!isEmpty && isQueryReady && !isFetching && !hasAnyResult && (
        <EmptyState icon={SearchIcon} title={t('search.empty', { query: trimmed })} testID="search-empty" />
      )}

      {!isEmpty && isQueryReady && !isFetching && hasAnyResult && (
        <SectionList
          sections={sections}
          keyExtractor={item => `${item.kind}-${item.item.id}`}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-6"
          stickySectionHeadersEnabled={false}
          // The backend caps each group at 10, so the whole list is bounded and
          // small. Render it in one pass: with the default window, virtualization
          // can drop the trailing sections before they're scrolled to — and the
          // trailing section here is `notes`, the group that must never silently
          // disappear (E-054 / NIC-1909).
          initialNumToRender={MAX_RESULTS}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-2 px-3 pb-1 pt-3" testID={`group-${section.kind}`}>
              <Text className="text-xs font-semibold uppercase text-muted-foreground dark:text-muted-foreground-dark">
                {t(section.titleKey)}
              </Text>
              <Text className="text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <SearchResultRow
              kind={item.kind}
              title={titleOf(item)}
              meta={metaOf(item)}
              query={trimmed}
              onPress={() => navigateToResult(item)}
              testID={`result-${item.kind}-${item.item.id}`}
            />
          )}
        />
      )}
    </View>
  );
}

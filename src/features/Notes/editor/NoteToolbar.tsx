import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import {
  Baseline,
  Bold,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  MessageSquareQuote,
  Minus,
  Table,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { DateField } from '@/components/fields/DateField';
import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';

import { CALLOUT_ICON_COMPONENTS } from './calloutIconComponents';
import { NOTE_CALLOUT_ICONS } from './calloutIcons';
import { CALLOUT_SWATCH, isNoteColorToken, NOTE_COLOR_TOKENS } from './colorTokens';
import { type NoteEditorCommand, type NoteEditorState } from './NoteEditorWebView';

interface ToolbarButtonProps {
  icon: typeof Bold;
  isActive?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function ToolbarButton({ icon: Icon, isActive, disabled, onPress, accessibilityLabel }: ToolbarButtonProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!isActive, disabled: !!disabled }}
      className={cn(
        'size-9 items-center justify-center rounded-md',
        isActive && 'bg-primary/10 dark:bg-primary-dark/10',
        disabled && 'opacity-40'
      )}
    >
      <Icon
        size={18}
        color={
          isActive
            ? isDark
              ? '#6366f1'
              : '#4f46e5'
            : disabled
              ? isDark
                ? '#475569'
                : '#cbd5e1'
              : isDark
                ? '#e2e8f0'
                : '#1e293b'
        }
      />
    </Pressable>
  );
}

// Distinct tinted pill (icon + label + chevron) rather than a plain toolbar
// icon — mirrors web's TableControls trigger. This button only exists while
// the caret is inside a table, so it needs to read as "options for THIS
// element" at a glance, not blend into the row of always-present buttons.
function TableMenuTrigger({ label, onPress }: { label: string; onPress: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const tint = isDark ? '#818cf8' : '#4f46e5';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID="note-table-menu"
      className="h-9 flex-row items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 dark:border-primary-dark/40 dark:bg-primary-dark/15"
    >
      <Table size={16} color={tint} />
      <Text className="text-sm font-medium" style={{ color: tint }}>
        {label}
      </Text>
      <ChevronDown size={12} color={tint} style={{ opacity: 0.7 }} />
    </Pressable>
  );
}

interface NoteToolbarProps {
  state: NoteEditorState | null;
  onCommand: (command: NoteEditorCommand) => void;
}

// Native RN toolbar per the NIC-1982 decision doc — never rendered inside the
// WebView. Every button posts a command across the bridge; state (pressed/
// active) comes from NoteEditorWebView's polled `state` messages. Covers all
// 17 controls named in NIC-1984's AC7 (heading1/2/3 count individually).
export function NoteToolbar({ state, onCommand }: NoteToolbarProps) {
  const { t } = useTranslation('notes');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const linkSheetRef = useRef<SheetRef>(null);
  const calloutSheetRef = useRef<SheetRef>(null);
  const dateSheetRef = useRef<SheetRef>(null);
  const textColorSheetRef = useRef<SheetRef>(null);
  const highlightSheetRef = useRef<SheetRef>(null);
  const tableSheetRef = useRef<SheetRef>(null);

  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | undefined>();
  const [calloutIcon, setCalloutIcon] = useState<(typeof NOTE_CALLOUT_ICONS)[number]>('info');
  const [calloutColor, setCalloutColor] = useState<(typeof NOTE_COLOR_TOKENS)[number]>('blue');
  const [mentionDate, setMentionDate] = useState<string | null>(null);

  const isAllowedLinkProtocol = (url: string) =>
    ['http:', 'https:', 'mailto:'].some(p => url.toLowerCase().startsWith(p));

  const submitLink = () => {
    const trimmed = linkUrl.trim();
    if (!isAllowedLinkProtocol(trimmed)) {
      setLinkError(t('toolbar.linkInvalid'));
      return;
    }
    onCommand({ type: 'setLink', href: trimmed });
    setLinkUrl('');
    setLinkError(undefined);
    linkSheetRef.current?.dismiss();
  };

  return (
    <>
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={t('toolbar.label')}
        className="border-b border-border dark:border-border-dark"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 4, gap: 2 }}>
          <ToolbarButton
            icon={Bold}
            isActive={state?.isBold}
            accessibilityLabel={t('toolbar.bold')}
            onPress={() => onCommand({ type: 'toggleBold' })}
          />
          <ToolbarButton
            icon={Italic}
            isActive={state?.isItalic}
            accessibilityLabel={t('toolbar.italic')}
            onPress={() => onCommand({ type: 'toggleItalic' })}
          />
          <ToolbarButton
            icon={Heading1}
            isActive={state?.isHeading1}
            accessibilityLabel={t('toolbar.heading1')}
            onPress={() => onCommand({ type: 'toggleHeading', level: 1 })}
          />
          <ToolbarButton
            icon={Heading2}
            isActive={state?.isHeading2}
            accessibilityLabel={t('toolbar.heading2')}
            onPress={() => onCommand({ type: 'toggleHeading', level: 2 })}
          />
          <ToolbarButton
            icon={Heading3}
            isActive={state?.isHeading3}
            accessibilityLabel={t('toolbar.heading3')}
            onPress={() => onCommand({ type: 'toggleHeading', level: 3 })}
          />
          <ToolbarButton
            icon={List}
            isActive={state?.isBulletList}
            accessibilityLabel={t('toolbar.bulletList')}
            onPress={() => onCommand({ type: 'toggleBulletList' })}
          />
          <ToolbarButton
            icon={ListOrdered}
            isActive={state?.isOrderedList}
            accessibilityLabel={t('toolbar.orderedList')}
            onPress={() => onCommand({ type: 'toggleOrderedList' })}
          />
          <ToolbarButton
            icon={CheckSquare}
            isActive={state?.isTaskList}
            accessibilityLabel={t('toolbar.taskList')}
            onPress={() => onCommand({ type: 'toggleTaskList' })}
          />
          <ToolbarButton
            icon={Code}
            isActive={state?.isCodeBlock}
            accessibilityLabel={t('toolbar.codeBlock')}
            onPress={() => onCommand({ type: 'toggleCodeBlock' })}
          />
          <ToolbarButton
            icon={Table}
            isActive={state?.isTable}
            accessibilityLabel={t('toolbar.table')}
            onPress={() => onCommand({ type: 'insertTable' })}
          />
          <ToolbarButton
            icon={MessageSquareQuote}
            isActive={state?.isCallout}
            accessibilityLabel={t('toolbar.callout')}
            onPress={() => calloutSheetRef.current?.present()}
          />
          <ToolbarButton
            icon={Minus}
            accessibilityLabel={t('toolbar.divider')}
            onPress={() => onCommand({ type: 'setHorizontalRule' })}
          />
          <ToolbarButton
            icon={Link2}
            isActive={state?.isLink}
            accessibilityLabel={t('toolbar.link')}
            onPress={() => linkSheetRef.current?.present()}
          />
          <ToolbarButton
            icon={Link2Off}
            disabled={!state?.isLink}
            accessibilityLabel={t('toolbar.unlink')}
            onPress={() => onCommand({ type: 'unsetLink' })}
          />
          <ToolbarButton
            icon={CalendarDays}
            isActive={state?.isDateMention}
            accessibilityLabel="Date mention"
            onPress={() => dateSheetRef.current?.present()}
          />
          <ToolbarButton
            icon={Baseline}
            isActive={!!state?.textColorToken}
            accessibilityLabel={t('toolbar.textColorGroup')}
            onPress={() => textColorSheetRef.current?.present()}
          />
          <ToolbarButton
            icon={Highlighter}
            isActive={!!state?.highlightToken}
            accessibilityLabel={t('toolbar.highlightGroup')}
            onPress={() => highlightSheetRef.current?.present()}
          />
          {state?.isTable && (
            <TableMenuTrigger label={t('toolbar.tableGroup')} onPress={() => tableSheetRef.current?.present()} />
          )}
        </ScrollView>
      </View>

      {/* Add link */}
      <Sheet ref={linkSheetRef} snapPoints={['40%']}>
        <SheetHeader>
          <SheetTitle>{t('toolbar.linkTitle')}</SheetTitle>
          <SheetDescription>{t('toolbar.linkDescription')}</SheetDescription>
        </SheetHeader>
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('toolbar.linkLabel')}
          </Text>
          <TextInput
            value={linkUrl}
            onChangeText={v => {
              setLinkUrl(v);
              setLinkError(undefined);
            }}
            placeholder="https://"
            placeholderTextColor={mutedColor}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="h-10 rounded-md border border-input dark:border-input-dark px-3 text-sm text-foreground dark:text-foreground-dark bg-background dark:bg-background-dark"
          />
          {linkError && <Text className="text-xs text-destructive dark:text-destructive-dark">{linkError}</Text>}
        </View>
        <SheetFooter>
          <Button label={t('toolbar.linkSave')} onPress={submitLink} />
          <Button
            label={t('toolbar.linkCancel')}
            variant="outline"
            onPress={() => {
              setLinkUrl('');
              setLinkError(undefined);
              linkSheetRef.current?.dismiss();
            }}
          />
        </SheetFooter>
      </Sheet>

      {/* Insert callout: icon + color pickers, native RN (not a WebView popover) */}
      <Sheet ref={calloutSheetRef} snapPoints={['55%']}>
        <SheetHeader>
          <SheetTitle>{t('toolbar.callout')}</SheetTitle>
        </SheetHeader>
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            {NOTE_CALLOUT_ICONS.map(icon => {
              const Icon = CALLOUT_ICON_COMPONENTS[icon];
              return (
                <Pressable
                  key={icon}
                  onPress={() => setCalloutIcon(icon)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: calloutIcon === icon }}
                  className={cn(
                    'size-11 items-center justify-center rounded-md border',
                    calloutIcon === icon
                      ? 'border-primary dark:border-primary-dark bg-primary/10 dark:bg-primary-dark/10'
                      : 'border-input dark:border-input-dark'
                  )}
                >
                  <Icon size={20} className="text-foreground dark:text-foreground-dark" />
                </Pressable>
              );
            })}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {NOTE_COLOR_TOKENS.map(token => (
              <Pressable
                key={token}
                onPress={() => setCalloutColor(token)}
                accessibilityRole="button"
                accessibilityLabel={token}
                accessibilityState={{ selected: calloutColor === token }}
                className={cn(
                  'size-8 rounded-full border-2',
                  calloutColor === token ? 'border-primary dark:border-primary-dark' : 'border-transparent'
                )}
                style={{ backgroundColor: CALLOUT_SWATCH[token] }}
              />
            ))}
          </View>
        </View>
        <SheetFooter>
          <Button
            label={t('toolbar.callout')}
            onPress={() => {
              onCommand({ type: 'setCallout', icon: calloutIcon, colorToken: calloutColor });
              calloutSheetRef.current?.dismiss();
            }}
          />
        </SheetFooter>
      </Sheet>

      {/* Date mention */}
      <Sheet ref={dateSheetRef} snapPoints={['55%']}>
        <SheetHeader>
          <SheetTitle>Date mention</SheetTitle>
        </SheetHeader>
        <DateField value={mentionDate} onChange={setMentionDate} />
        <SheetFooter>
          <Button
            label="Insert"
            disabled={!mentionDate}
            onPress={() => {
              if (!mentionDate) return;
              onCommand({ type: 'setDateMention', date: mentionDate });
              dateSheetRef.current?.dismiss();
            }}
          />
        </SheetFooter>
      </Sheet>

      {/* Text color */}
      <Sheet ref={textColorSheetRef} snapPoints={['40%']}>
        <SheetHeader>
          <SheetTitle>{t('toolbar.textColorGroup')}</SheetTitle>
        </SheetHeader>
        <View className="flex-row flex-wrap gap-2">
          {NOTE_COLOR_TOKENS.map(token => (
            <Pressable
              key={token}
              onPress={() => {
                onCommand({ type: 'setTextColor', token });
                textColorSheetRef.current?.dismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={token}
              className={cn(
                'size-8 rounded-full border-2',
                isNoteColorToken(state?.textColorToken) && state?.textColorToken === token
                  ? 'border-primary dark:border-primary-dark'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: CALLOUT_SWATCH[token] }}
            />
          ))}
        </View>
        <SheetFooter>
          <Button
            label="Clear"
            variant="outline"
            disabled={!state?.textColorToken}
            onPress={() => {
              onCommand({ type: 'unsetTextColor' });
              textColorSheetRef.current?.dismiss();
            }}
          />
        </SheetFooter>
      </Sheet>

      {/* Highlight color */}
      <Sheet ref={highlightSheetRef} snapPoints={['40%']}>
        <SheetHeader>
          <SheetTitle>{t('toolbar.highlightGroup')}</SheetTitle>
        </SheetHeader>
        <View className="flex-row flex-wrap gap-2">
          {NOTE_COLOR_TOKENS.map(token => (
            <Pressable
              key={token}
              onPress={() => {
                onCommand({ type: 'setHighlight', token });
                highlightSheetRef.current?.dismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={token}
              className={cn(
                'size-8 rounded-full border-2',
                isNoteColorToken(state?.highlightToken) && state?.highlightToken === token
                  ? 'border-primary dark:border-primary-dark'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: CALLOUT_SWATCH[token] }}
            />
          ))}
        </View>
        <SheetFooter>
          <Button
            label="Clear"
            variant="outline"
            disabled={!state?.highlightToken}
            onPress={() => {
              onCommand({ type: 'unsetHighlight' });
              highlightSheetRef.current?.dismiss();
            }}
          />
        </SheetFooter>
      </Sheet>

      {/* Table controls — only reachable when the caret is inside a table */}
      <Sheet ref={tableSheetRef} snapPoints={['55%']}>
        <SheetHeader>
          <SheetTitle>{t('toolbar.tableGroup')}</SheetTitle>
        </SheetHeader>
        <View className="gap-2">
          <Button
            label={t('toolbar.addColumnBefore')}
            variant="outline"
            onPress={() => onCommand({ type: 'addColumnBefore' })}
          />
          <Button
            label={t('toolbar.addColumnAfter')}
            variant="outline"
            onPress={() => onCommand({ type: 'addColumnAfter' })}
          />
          <Button
            label={t('toolbar.deleteColumn')}
            variant="outline"
            onPress={() => onCommand({ type: 'deleteColumn' })}
          />
          <Button
            label={t('toolbar.addRowBefore')}
            variant="outline"
            onPress={() => onCommand({ type: 'addRowBefore' })}
          />
          <Button
            label={t('toolbar.addRowAfter')}
            variant="outline"
            onPress={() => onCommand({ type: 'addRowAfter' })}
          />
          <Button label={t('toolbar.deleteRow')} variant="outline" onPress={() => onCommand({ type: 'deleteRow' })} />
          <Button
            label={t('toolbar.toggleHeaderRow')}
            variant="outline"
            onPress={() => onCommand({ type: 'toggleHeaderRow' })}
          />
          <Button
            label={t('toolbar.mergeOrSplit')}
            variant="outline"
            onPress={() => onCommand({ type: 'mergeOrSplit' })}
          />
          <Button
            label={t('toolbar.deleteTable')}
            variant="destructive"
            onPress={() => {
              onCommand({ type: 'deleteTable' });
              tableSheetRef.current?.dismiss();
            }}
          />
        </View>
      </Sheet>
    </>
  );
}

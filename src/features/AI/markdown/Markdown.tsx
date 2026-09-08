import { Linking, Text, View } from 'react-native';

import { type BlockNode, type InlineNode, parseMarkdown } from './parse';

interface MarkdownProps {
  content: string;
  /** Assistant bubbles sit on --card, user bubbles on --primary. */
  tone?: 'default' | 'inverted';
  testID?: string;
}

const HEADING_SIZE: Record<number, string> = {
  1: 'text-lg font-semibold',
  2: 'text-base font-semibold',
  3: 'text-sm font-semibold',
};

function Inline({ nodes, tone }: { nodes: InlineNode[]; tone: 'default' | 'inverted' }) {
  const body = tone === 'inverted' ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark';
  const muted =
    tone === 'inverted' ? 'text-primary-foreground' : 'text-muted-foreground dark:text-muted-foreground-dark';

  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'strong') {
          return (
            <Text key={i} className={`font-semibold ${body}`}>
              {node.value}
            </Text>
          );
        }
        if (node.type === 'em') {
          return (
            <Text key={i} className={`italic ${body}`}>
              {node.value}
            </Text>
          );
        }
        if (node.type === 'code') {
          return (
            <Text key={i} className={`font-mono text-[13px] ${muted}`}>
              {node.value}
            </Text>
          );
        }
        if (node.type === 'link') {
          // href is http(s)-only by construction (parse.ts drops every other
          // scheme), so this can never hand a javascript:/data: URL to the OS.
          return (
            <Text
              key={i}
              className={`underline ${body}`}
              accessibilityRole="link"
              onPress={() => void Linking.openURL(node.href)}
            >
              {node.value}
            </Text>
          );
        }
        return (
          <Text key={i} className={body}>
            {node.value}
          </Text>
        );
      })}
    </>
  );
}

function Block({ node, tone }: { node: BlockNode; tone: 'default' | 'inverted' }) {
  const body = tone === 'inverted' ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark';

  if (node.type === 'heading') {
    return (
      <Text className={`${HEADING_SIZE[node.level] ?? 'text-sm font-semibold'} ${body} mb-1`}>
        <Inline nodes={node.children} tone={tone} />
      </Text>
    );
  }

  if (node.type === 'codeBlock') {
    return (
      <View className="rounded-md bg-muted dark:bg-muted-dark px-3 py-2 my-1">
        <Text className="font-mono text-[13px] text-foreground dark:text-foreground-dark">{node.value}</Text>
      </View>
    );
  }

  if (node.type === 'blockquote') {
    return (
      <View className="border-l-2 border-border dark:border-border-dark pl-3 my-1">
        <Text className={`text-sm italic ${body}`}>
          <Inline nodes={node.children} tone={tone} />
        </Text>
      </View>
    );
  }

  if (node.type === 'listItem') {
    return (
      <View className="flex-row gap-2">
        <Text className={`text-sm ${body}`}>{node.marker}</Text>
        <Text className={`flex-1 text-sm leading-5 ${body}`}>
          <Inline nodes={node.children} tone={tone} />
        </Text>
      </View>
    );
  }

  return (
    <Text className={`text-sm leading-5 ${body}`}>
      <Inline nodes={node.children} tone={tone} />
    </Text>
  );
}

// Renders assistant markdown. Untrusted LLM text — see parse.ts for the security
// properties (no HTML interpretation, images stripped, http(s)-only links).
export function Markdown({ content, tone = 'default', testID }: MarkdownProps) {
  const blocks = parseMarkdown(content);

  return (
    <View className="gap-1" testID={testID}>
      {blocks.map((node, i) => (
        <Block key={i} node={node} tone={tone} />
      ))}
    </View>
  );
}

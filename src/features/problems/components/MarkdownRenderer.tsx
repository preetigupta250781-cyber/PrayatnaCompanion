import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface MarkdownRendererProps {
  content: string;
  testID?: string;
}

/**
 * Strips all HTML tags to prevent HTML/XSS injection.
 */
export function sanitizeHtml(raw: string): string {
  // Recursively remove any <tag ...> patterns
  return raw.replace(/<[^>]*>?/gm, '');
}

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  text: string;
  url?: string;
}

/**
 * Parses inline markdown tokens (bold, italic, code, link) safely
 */
export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Regex matches:
  // 1. Bold: \*\*(.+?)\*\*
  // 2. Italic: \*(.+?)\*
  // 3. Inline code: `([^`]+)`
  // 4. Markdown link: \[([^\]]+)\]\(([^)]+)\)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push({
        type: 'bold',
        text: matchedStr.slice(2, -2),
      });
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push({
        type: 'italic',
        text: matchedStr.slice(1, -1),
      });
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push({
        type: 'code',
        text: matchedStr.slice(1, -1),
      });
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        tokens.push({
          type: 'link',
          text: linkMatch[1],
          url: linkMatch[2],
        });
      } else {
        tokens.push({ type: 'text', text: matchedStr });
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      text: text.slice(lastIndex),
    });
  }

  return tokens;
}

type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'code_block'
  | 'blockquote'
  | 'bullet_item'
  | 'ordered_item'
  | 'hr'
  | 'paragraph';

interface MarkdownBlock {
  id: string;
  type: BlockType;
  content: string;
  orderNumber?: number;
  language?: string;
}

/**
 * Splits markdown content into structural blocks safely
 */
export function parseMarkdownBlocks(rawMarkdown: string): MarkdownBlock[] {
  // Step 1: Strip HTML tags to ensure safe markdown rendering with no HTML injection
  const sanitized = sanitizeHtml(rawMarkdown);
  const lines = sanitized.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let paragraphBuffer: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphBuffer.length > 0) {
      blocks.push({
        id: `p-${blocks.length}`,
        type: 'paragraph',
        content: paragraphBuffer.join(' ').trim(),
      });
      paragraphBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // Handle code block fences
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Closing fence
        blocks.push({
          id: `code-${blocks.length}`,
          type: 'code_block',
          content: codeBuffer.join('\n'),
          language: codeLang,
        });
        codeBuffer = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        // Opening fence
        flushParagraph();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ id: `hr-${blocks.length}`, type: 'hr', content: '' });
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      blocks.push({ id: `h1-${blocks.length}`, type: 'h1', content: trimmed.slice(2).trim() });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({ id: `h2-${blocks.length}`, type: 'h2', content: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push({ id: `h3-${blocks.length}`, type: 'h3', content: trimmed.slice(4).trim() });
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      flushParagraph();
      blocks.push({ id: `h4-${blocks.length}`, type: 'h4', content: trimmed.slice(5).trim() });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph();
      blocks.push({
        id: `quote-${blocks.length}`,
        type: 'blockquote',
        content: trimmed.replace(/^>\s?/, '').trim(),
      });
      continue;
    }

    // Unordered List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push({
        id: `bullet-${blocks.length}`,
        type: 'bullet_item',
        content: trimmed.replace(/^[-*]\s+/, '').trim(),
      });
      continue;
    }

    // Ordered List (1. )
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch && orderedMatch[1] && orderedMatch[2]) {
      flushParagraph();
      blocks.push({
        id: `ordered-${blocks.length}`,
        type: 'ordered_item',
        orderNumber: parseInt(orderedMatch[1], 10),
        content: orderedMatch[2].trim(),
      });
      continue;
    }

    // Empty line indicates paragraph break
    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    // Plain text line accumulating into current paragraph
    paragraphBuffer.push(line);
  }

  // Flush remaining buffers
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      id: `code-${blocks.length}`,
      type: 'code_block',
      content: codeBuffer.join('\n'),
      language: codeLang,
    });
  } else {
    flushParagraph();
  }

  return blocks;
}

/**
 * Safe, robust Markdown Renderer supporting formatted text, code blocks,
 * lists, quotes, and sanitized HTML.
 */
export function MarkdownRenderer({ content, testID }: MarkdownRendererProps): React.JSX.Element {
  const theme = useAppTheme();

  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  const renderInline = (text: string, baseStyle?: TextStyle): React.JSX.Element[] => {
    const tokens = parseInlineTokens(text);
    return tokens.map((token, index) => {
      switch (token.type) {
        case 'bold':
          return (
            <Text
              key={index}
              style={[baseStyle, styles.bold, { color: theme.colors.text }]}
              allowFontScaling
            >
              {token.text}
            </Text>
          );
        case 'italic':
          return (
            <Text
              key={index}
              style={[baseStyle, styles.italic, { color: theme.colors.text }]}
              allowFontScaling
            >
              {token.text}
            </Text>
          );
        case 'code':
          return (
            <Text
              key={index}
              style={[
                baseStyle,
                styles.inlineCode,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  color: theme.colors.accent,
                },
              ]}
              allowFontScaling
            >
              {` ${token.text} `}
            </Text>
          );
        case 'link':
          return (
            <Text
              key={index}
              style={[baseStyle, styles.link, { color: theme.colors.accent }]}
              allowFontScaling
            >
              {token.text}
            </Text>
          );
        case 'text':
        default:
          return (
            <Text key={index} style={baseStyle} allowFontScaling>
              {token.text}
            </Text>
          );
      }
    });
  };

  return (
    <View style={styles.container} testID={testID}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'h1':
            return (
              <Text
                key={block.id}
                style={[styles.h1, { color: theme.colors.text }]}
                allowFontScaling
              >
                {block.content}
              </Text>
            );
          case 'h2':
            return (
              <Text
                key={block.id}
                style={[styles.h2, { color: theme.colors.text }]}
                allowFontScaling
              >
                {block.content}
              </Text>
            );
          case 'h3':
            return (
              <Text
                key={block.id}
                style={[styles.h3, { color: theme.colors.text }]}
                allowFontScaling
              >
                {block.content}
              </Text>
            );
          case 'h4':
            return (
              <Text
                key={block.id}
                style={[styles.h4, { color: theme.colors.text }]}
                allowFontScaling
              >
                {block.content}
              </Text>
            );
          case 'code_block':
            return (
              <View
                key={block.id}
                style={[
                  styles.codeBlock,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {block.language ? (
                  <Text style={[styles.codeLang, { color: theme.colors.textMuted }]}>
                    {block.language}
                  </Text>
                ) : null}
                <Text
                  style={[styles.codeText, { color: theme.colors.textSecondary }]}
                  allowFontScaling
                >
                  {block.content}
                </Text>
              </View>
            );
          case 'blockquote':
            return (
              <View
                key={block.id}
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: theme.colors.accent,
                    backgroundColor: theme.colors.surfaceElevated,
                  },
                ]}
              >
                <Text
                  style={[styles.blockquoteText, { color: theme.colors.textSecondary }]}
                  allowFontScaling
                >
                  {renderInline(block.content, { color: theme.colors.textSecondary })}
                </Text>
              </View>
            );
          case 'bullet_item':
            return (
              <View key={block.id} style={styles.listItem}>
                <Text style={[styles.bullet, { color: theme.colors.accent }]}>•</Text>
                <Text
                  style={[styles.listText, { color: theme.colors.textSecondary }]}
                  allowFontScaling
                >
                  {renderInline(block.content, { color: theme.colors.textSecondary })}
                </Text>
              </View>
            );
          case 'ordered_item':
            return (
              <View key={block.id} style={styles.listItem}>
                <Text style={[styles.orderNumber, { color: theme.colors.accent }]}>
                  {block.orderNumber}.
                </Text>
                <Text
                  style={[styles.listText, { color: theme.colors.textSecondary }]}
                  allowFontScaling
                >
                  {renderInline(block.content, { color: theme.colors.textSecondary })}
                </Text>
              </View>
            );
          case 'hr':
            return (
              <View key={block.id} style={[styles.hr, { backgroundColor: theme.colors.border }]} />
            );
          case 'paragraph':
          default:
            return (
              <Text
                key={block.id}
                style={[styles.paragraph, { color: theme.colors.textSecondary }]}
                allowFontScaling
              >
                {renderInline(block.content, { color: theme.colors.textSecondary })}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
    lineHeight: 30,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 26,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 22,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 20,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  codeBlock: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
  },
  codeLang: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 10,
  },
  blockquoteText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
    fontWeight: '700',
  },
  orderNumber: {
    fontSize: 14,
    lineHeight: 22,
    marginRight: 6,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  hr: {
    height: 1,
    marginVertical: 16,
    width: '100%',
  },
});

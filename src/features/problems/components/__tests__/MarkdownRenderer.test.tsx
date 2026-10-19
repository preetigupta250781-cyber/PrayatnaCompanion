import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import {
  MarkdownRenderer,
  parseInlineTokens,
  parseMarkdownBlocks,
  sanitizeHtml,
} from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  describe('sanitizeHtml security enforcement', () => {
    it('strips malicious <script> tags and payloads completely', () => {
      const malicious = 'Hello <script>alert("XSS Attack!")</script> World';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).toBe('Hello alert("XSS Attack!") World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('strips <iframe>, <img> and dangerous event handlers', () => {
      const payload =
        'Preview: <iframe src="https://evil.com"></iframe><img src="x" onerror="stealCookies()" />';
      const sanitized = sanitizeHtml(payload);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toBe('Preview: ');
    });

    it('strips nested HTML styling tags to prevent styling distortion', () => {
      const htmlText = '<div style="position:fixed;top:0;"><b>Bold Text</b></div>';
      const sanitized = sanitizeHtml(htmlText);
      expect(sanitized).toBe('Bold Text');
    });
  });

  describe('parseInlineTokens', () => {
    it('parses plain text, bold, italic, inline code, and links correctly', () => {
      const text =
        'This is **bold** text, *italic* word, `const x = 10` code and [Documentation](https://docs.expo.dev).';
      const tokens = parseInlineTokens(text);

      expect(tokens).toEqual([
        { type: 'text', text: 'This is ' },
        { type: 'bold', text: 'bold' },
        { type: 'text', text: ' text, ' },
        { type: 'italic', text: 'italic' },
        { type: 'text', text: ' word, ' },
        { type: 'code', text: 'const x = 10' },
        { type: 'text', text: ' code and ' },
        { type: 'link', text: 'Documentation', url: 'https://docs.expo.dev' },
        { type: 'text', text: '.' },
      ]);
    });
  });

  describe('parseMarkdownBlocks', () => {
    it('parses headings, code blocks, quotes, lists, and horizontal dividers', () => {
      const markdown = `
# Main Track Title
## Overview
### Technical Requirements
#### Sub-constraints

> Critical: Solution must support offline data collection.

- Feature 1: Acoustic analysis
- Feature 2: Sensor mesh

1. Step 1: Install dependencies
2. Step 2: Configure environment

\`\`\`typescript
const client = createClient();
await client.sync();
\`\`\`

---

Final conclusion notes.
      `.trim();

      const blocks = parseMarkdownBlocks(markdown);
      expect(blocks.some((b) => b.type === 'h1' && b.content === 'Main Track Title')).toBe(true);
      expect(blocks.some((b) => b.type === 'h2' && b.content === 'Overview')).toBe(true);
      expect(blocks.some((b) => b.type === 'h3' && b.content === 'Technical Requirements')).toBe(
        true
      );
      expect(blocks.some((b) => b.type === 'h4' && b.content === 'Sub-constraints')).toBe(true);
      expect(blocks.some((b) => b.type === 'blockquote')).toBe(true);
      expect(blocks.filter((b) => b.type === 'bullet_item')).toHaveLength(2);
      expect(blocks.filter((b) => b.type === 'ordered_item')).toHaveLength(2);
      expect(blocks.some((b) => b.type === 'code_block')).toBe(true);
      expect(blocks.some((b) => b.type === 'hr')).toBe(true);
      expect(
        blocks.some((b) => b.type === 'paragraph' && b.content.includes('Final conclusion'))
      ).toBe(true);
    });
  });

  describe('Long descriptions rendering', () => {
    it('renders a large 5000+ character markdown description smoothly without crashing', () => {
      const longDescriptionParagraph =
        'Prayatna 2026 hackathon track requirement for high performance edge processing. ' +
        'Teams must optimize their memory footprint, eliminate race conditions in asynchronous queues, ' +
        'and guarantee zero memory leaks over 24 hours of continuous telemetry ingest. ';

      const repeatedContent = Array.from({ length: 40 }, (_, i) => {
        return `
### Section ${i + 1}: Data Pipeline Architecture
${longDescriptionParagraph}

> Requirement ${i + 1}: Latency under 50ms at P99 percentile.

- Micro-service ${i + 1}.A: Ingest parser
- Micro-service ${i + 1}.B: Schema validator with \`zod\`

\`\`\`json
{
  "sectionId": ${i + 1},
  "status": "APPROVED",
  "checksum": "sha256-abc123"
}
\`\`\`
        `;
      }).join('\n');

      expect(repeatedContent.length).toBeGreaterThan(5000);

      let tree: renderer.ReactTestRenderer | null = null;
      expect(() => {
        renderer.act(() => {
          tree = renderer.create(
            <MarkdownRenderer content={repeatedContent} testID="long-description-renderer" />
          );
        });
      }).not.toThrow();

      expect(tree).not.toBeNull();
      const instance = (tree as renderer.ReactTestRenderer | null)?.root;
      expect(instance).toBeDefined();
    });

    it('renders HTML-injected input without injecting HTML tags', () => {
      const maliciousContent =
        '# Secure Header\n<script>alert("hackathon")</script>\n<p>Safe paragraph text</p>';

      let tree: renderer.ReactTestRenderer | null = null;
      renderer.act(() => {
        tree = renderer.create(<MarkdownRenderer content={maliciousContent} />);
      });
      const textNodes = tree!.root.findAllByType(Text);
      const allText = textNodes
        .map((n) => n.props.children)
        .flat()
        .join(' ');

      expect(allText).not.toContain('<script>');
      expect(allText).not.toContain('</script>');
      expect(allText).toContain('alert("hackathon")');
      expect(allText).toContain('Safe paragraph text');
    });
  });
});

'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Safe, zero-HTML-injection lightweight Markdown renderer for problem descriptions.
 */
export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-zinc-500 italic text-sm">No description provided.</p>;
  }

  // Parse lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const renderInline = (text: string): React.ReactNode[] => {
    // Basic inline formatting: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex matching bold, code, italic
    const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/;

    while (remaining.length > 0) {
      const match = remaining.match(regex);
      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      if (match.index > 0) {
        parts.push(remaining.substring(0, match.index));
      }

      const fullMatch = match[0];
      if (fullMatch.startsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-zinc-100">
            {match[2]}
          </strong>
        );
      } else if (fullMatch.startsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[#00F0FF] text-xs font-mono"
          >
            {match[3]}
          </code>
        );
      } else if (fullMatch.startsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-zinc-300">
            {match[4]}
          </em>
        );
      }

      remaining = remaining.substring(match.index + fullMatch.length);
    }

    return parts;
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre
            key={`code-${index}`}
            className="bg-[#0A0D14] border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-zinc-300"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        // Start code block
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="text-sm font-bold text-white mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="text-base font-bold text-white mt-4 mb-1.5">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="text-lg font-bold text-[#00F0FF] mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={index} className="text-sm text-zinc-300 ml-5 list-disc my-0.5">
          {renderInline(line.trim().slice(2))}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={index} className="h-2" />);
    } else {
      elements.push(
        <p key={index} className="text-sm text-zinc-300 leading-relaxed my-1">
          {renderInline(line)}
        </p>
      );
    }
  });

  // Flush open code block if any
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="open-code"
        className="bg-[#0A0D14] border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-zinc-300"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

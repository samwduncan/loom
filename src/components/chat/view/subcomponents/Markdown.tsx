import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeInlineCodeFences } from '../../utils/chatFormatting';
import { ShikiCodeBlock } from './CodeBlock';
import '../../styles/streaming-cursor.css';

type MarkdownProps = {
  children: React.ReactNode;
  className?: string;
  isStreaming?: boolean;
};

/**
 * Preprocess markdown during streaming to handle incomplete block elements.
 *
 * - Inline markdown (bold, italic, inline code) renders live — untouched.
 * - Incomplete block starters (headers, list markers) at the very end are stripped
 *   so they don't flash as plain text before the delimiter completes.
 * - Unclosed code fences get a synthetic closing fence so ReactMarkdown renders
 *   a proper <pre><code> block immediately; the synthetic fence disappears once
 *   the real closing fence arrives (fence count becomes even).
 *
 * Designed to run every render frame — string operations only, no backtracking regexes.
 */
function preprocessStreamingMarkdown(text: string): string {
  if (!text) return text;

  // --- Part C: Unclosed code fence detection ---
  // Count triple-backtick fences that start at the beginning of a line.
  // Using /^```/gm (start-of-line anchor) avoids false positives from
  // triple backticks inside inline code spans (which don't start a line).
  const fenceMatches = text.match(/^```/gm);
  const fenceCount = fenceMatches ? fenceMatches.length : 0;

  // Odd number of fences means an unclosed code block — close it synthetically
  if (fenceCount % 2 === 1) {
    return text + '\n```';
  }

  // --- Part B: Incomplete block element stripping ---
  const lastNewlineIdx = text.lastIndexOf('\n');
  if (lastNewlineIdx === -1) return text; // Single line — render as-is

  const lastLine = text.slice(lastNewlineIdx + 1);

  // Incomplete header: line starts with 1-6 # chars followed by optional spaces but no content
  if (/^#{1,6}\s*$/.test(lastLine)) {
    return text.slice(0, lastNewlineIdx);
  }

  // Incomplete list item: line starts with bullet/number marker but has no content yet
  if (/^(\s*[-*+]|\s*\d+\.)\s*$/.test(lastLine)) {
    return text.slice(0, lastNewlineIdx);
  }

  return text;
}

type CodeBlockProps = {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/** Static markdown sub-components (no streaming dependency) */
const staticComponents = {
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-gray-300 border-gray-600 pl-4 italic text-gray-600 text-gray-400 my-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-blue-600 text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <div className="mb-2 last:mb-0">{children}</div>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border-collapse border border-gray-200 border-gray-700">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-gray-50 bg-gray-800">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-sm font-semibold border border-gray-200 border-gray-700">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 align-top text-sm border border-gray-200 border-gray-700">{children}</td>
  ),
};

function makeCodeComponent(isStreaming: boolean) {
  return function CodeBlockComponent({ node, inline, className, children, ...props }: CodeBlockProps) {
    const raw = Array.isArray(children) ? children.join('') : String(children ?? '');
    const looksMultiline = /[\r\n]/.test(raw);
    const inlineDetected = inline || (node && node.type === 'inlineCode');
    const shouldInline = inlineDetected || !looksMultiline;

    if (shouldInline) {
      return (
        <code
          className={`font-mono text-[0.9em] px-1.5 py-0.5 rounded-md bg-gray-800/60 text-gray-100 border border-gray-700 whitespace-pre-wrap break-words ${className || ''
            }`}
          {...props}
        >
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    // Strip trailing newline that react-markdown often appends
    const trimmed = raw.replace(/\n$/, '');

    return <ShikiCodeBlock code={trimmed} language={language} isStreaming={isStreaming} />;
  };
}

export function Markdown({ children, className, isStreaming = false }: MarkdownProps) {
  const normalized = normalizeInlineCodeFences(String(children ?? ''));
  // During streaming, preprocess to defer incomplete block elements and close unclosed fences.
  // When not streaming, pass through unchanged — complete markdown renders fully.
  const content = isStreaming ? preprocessStreamingMarkdown(normalized) : normalized;
  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex], []);

  // Memoize components object; only rebuild when isStreaming changes
  const components = useMemo(
    () => ({ ...staticComponents, code: makeCodeComponent(isStreaming) }),
    [isStreaming]
  );

  return (
    <div className={`${className || ''}${isStreaming ? ' streaming-cursor message-streaming' : ''}`}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components as any}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

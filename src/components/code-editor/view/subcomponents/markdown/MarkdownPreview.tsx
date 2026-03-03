import { useMemo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import MarkdownCodeBlock from './MarkdownCodeBlock';

type MarkdownPreviewProps = {
  content: string;
};

const markdownPreviewComponents: Components = {
  code: MarkdownCodeBlock,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border/20 pl-4 italic text-muted-foreground my-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border-collapse border border-border/10">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-elevated">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-sm font-semibold border border-border/10">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 align-top text-sm border border-border/10">{children}</td>
  ),
};

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex], []);

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownPreviewComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

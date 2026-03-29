/**
 * MarkdownRenderer -- react-markdown wrapper with custom component overrides.
 *
 * Renders finalized assistant messages as rich formatted content using
 * react-markdown + remark-gfm (tables, strikethrough, task lists) +
 * rehype-raw (HTML passthrough for <details>, etc.).
 *
 * All styling uses Tailwind utility classes referencing OKLCH design tokens.
 * No @tailwindcss/typography prose classes.
 *
 * Fenced code blocks route to CodeBlock (Shiki highlighting).
 * Inline code gets bg-code-inline monospace styling.
 *
 * Constitution: Named exports (2.2), cn() not needed (pure className strings).
 */

import { useState, useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ImageLightbox } from '@/components/chat/view/ImageLightbox';
import { CodeBlock } from './CodeBlock';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  // Strip <pre> wrapper -- CodeBlock has its own container
  pre: ({ children }) => <>{children}</>,

  // Fenced vs inline code detection
  code: ({ className, children, ...rest }) => {
    const match = className?.match(/language-(\w+)/);
    if (match?.[1]) {
      return (
        <CodeBlock
          language={match[1]}
          code={String(children).trimEnd()}
        />
      );
    }
    return (
      <code
        className="bg-code-inline rounded-sm px-1.5 py-0.5 font-mono text-[0.85em] break-all"
        {...rest}
      >
        {children}
      </code>
    );
  },

  // Links: external vs internal
  a: ({ href, children, ...rest }) => {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        className="text-primary underline-offset-2 hover:underline"
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },

  // Blockquote with left border accent
  blockquote: ({ children, ...rest }) => (
    <blockquote
      className="border-l-2 border-primary/30 pl-4 text-muted italic"
      {...rest}
    >
      {children}
    </blockquote>
  ),

  // Table with horizontal scroll wrapper
  table: ({ children, ...rest }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse text-sm" {...rest}>
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...rest }) => (
    <th
      className="text-left px-3 py-2 border-b border-border font-medium text-foreground"
      {...rest}
    >
      {children}
    </th>
  ),

  td: ({ children, ...rest }) => (
    <td
      className="px-3 py-2 border-b border-border text-secondary-foreground"
      {...rest}
    >
      {children}
    </td>
  ),

  // Headings
  h1: ({ children, ...rest }) => (
    <h1 className="text-2xl font-bold mt-6 mb-3" {...rest}>
      {children}
    </h1>
  ),
  h2: ({ children, ...rest }) => (
    <h2 className="text-xl font-bold mt-5 mb-2" {...rest}>
      {children}
    </h2>
  ),
  h3: ({ children, ...rest }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2" {...rest}>
      {children}
    </h3>
  ),
  h4: ({ children, ...rest }) => (
    <h4 className="text-base font-semibold mt-3 mb-1" {...rest}>
      {children}
    </h4>
  ),
  h5: ({ children, ...rest }) => (
    <h5 className="text-base font-semibold mt-3 mb-1" {...rest}>
      {children}
    </h5>
  ),
  h6: ({ children, ...rest }) => (
    <h6 className="text-base font-semibold mt-3 mb-1" {...rest}>
      {children}
    </h6>
  ),

  // Lists
  ul: ({ children, ...rest }) => (
    <ul className="list-disc pl-6 my-2 space-y-1" {...rest}>
      {children}
    </ul>
  ),
  ol: ({ children, ...rest }) => (
    <ol className="list-decimal pl-6 my-2 space-y-1" {...rest}>
      {children}
    </ol>
  ),

  // Horizontal rule
  hr: ({ ...rest }) => <hr className="border-border my-4" {...rest} />,

  // Paragraphs
  p: ({ children, ...rest }) => (
    <p className="my-2 leading-relaxed" {...rest}>
      {children}
    </p>
  ),
};

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Memoize components to prevent react-markdown from remounting custom elements
  // on parent re-renders. Without this, ToolChip loses expanded state on every render.
  const componentsWithImg = useMemo<Components>(() => {
    return {
      ...components,
      img: ({ src, alt, ...props }) => (
        <img
          src={src}
          alt={alt ?? ''}
          className="max-w-full w-auto h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity my-2"
          onClick={() => src && setLightboxSrc(src)}
          {...props}
        />
      ),
    };
  }, []);

  return (
    <div className="markdown-body text-foreground text-[length:var(--text-body)] leading-relaxed overflow-hidden">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={componentsWithImg}
      >
        {content}
      </Markdown>
      <ImageLightbox
        src={lightboxSrc}
        alt=""
        open={lightboxSrc !== null}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
});

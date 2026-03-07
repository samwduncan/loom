import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

vi.mock('./CodeBlock', () => ({
  CodeBlock: ({ language, code }: { language: string; code: string }) => (
    <div data-testid="code-block" data-language={language}>
      {code}
    </div>
  ),
}));

describe('MarkdownRenderer', () => {
  it('renders bold text as <strong>', () => {
    render(<MarkdownRenderer content="**bold**" />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders italic text as <em>', () => {
    render(<MarkdownRenderer content="*italic*" />);
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('renders strikethrough as <del>', () => {
    render(<MarkdownRenderer content="~~strikethrough~~" />);
    expect(screen.getByText('strikethrough').tagName).toBe('DEL');
  });

  it('renders unordered list as <ul> with <li>', () => {
    const { container } = render(
      <MarkdownRenderer content={'- item one\n- item two'} />,
    );
    const ul = container.querySelector('ul');
    expect(ul).toBeTruthy();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('renders ordered list as <ol> with <li>', () => {
    const { container } = render(
      <MarkdownRenderer content={'1. first\n2. second'} />,
    );
    const ol = container.querySelector('ol');
    expect(ol).toBeTruthy();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('renders headings with correct elements', () => {
    const { container } = render(
      <MarkdownRenderer content={'# H1\n\n## H2\n\n### H3'} />,
    );
    expect(container.querySelector('h1')).toBeTruthy();
    expect(container.querySelector('h2')).toBeTruthy();
    expect(container.querySelector('h3')).toBeTruthy();
  });

  it('renders blockquote with border and italic classes', () => {
    const { container } = render(
      <MarkdownRenderer content="> quote text" />,
    );
    const bq = container.querySelector('blockquote');
    expect(bq).toBeTruthy();
    expect(bq!.className).toContain('border-l-2'); // ASSERT: bq confirmed truthy on previous line
    expect(bq!.className).toContain('italic'); // ASSERT: bq confirmed truthy on previous line
  });

  it('renders external link with target="_blank" and rel', () => {
    render(
      <MarkdownRenderer content="[ext](https://example.com)" />,
    );
    const link = screen.getByText('ext');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders internal link without target="_blank"', () => {
    render(<MarkdownRenderer content="[int](/local)" />);
    const link = screen.getByText('int');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('routes fenced code blocks to CodeBlock', () => {
    render(
      <MarkdownRenderer content={'```ts\nconst x = 1;\n```'} />,
    );
    const block = screen.getByTestId('code-block');
    expect(block).toBeTruthy();
    expect(block.getAttribute('data-language')).toBe('ts');
    expect(block.textContent).toContain('const x = 1;');
  });

  it('renders inline code with bg-code-inline class', () => {
    render(<MarkdownRenderer content="use `inline` code" />);
    const code = screen.getByText('inline');
    expect(code.tagName).toBe('CODE');
    expect(code.className).toContain('bg-code-inline');
  });

  it('wraps GFM table in overflow-x-auto container', () => {
    const table = '| a | b |\n|---|---|\n| 1 | 2 |';
    const { container } = render(<MarkdownRenderer content={table} />);
    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).toBeTruthy();
    expect(wrapper!.querySelector('table')).toBeTruthy(); // ASSERT: wrapper confirmed truthy on previous line
  });

  it('renders horizontal rule as <hr>', () => {
    const { container } = render(
      <MarkdownRenderer content={'above\n\n---\n\nbelow'} />,
    );
    expect(container.querySelector('hr')).toBeTruthy();
  });

  it('renders GFM task list with checkbox', () => {
    const { container } = render(
      <MarkdownRenderer content={'- [x] done\n- [ ] pending'} />,
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);
  });

  it('renders link with text-primary class', () => {
    render(
      <MarkdownRenderer content="[styled](https://example.com)" />,
    );
    const link = screen.getByText('styled');
    expect(link.className).toContain('text-primary');
  });

  it('passes through <details> and <summary> HTML via rehype-raw', () => {
    const { container } = render(
      <MarkdownRenderer content="<details><summary>Info</summary>Content</details>" />,
    );
    expect(container.querySelector('details')).toBeTruthy();
    expect(container.querySelector('summary')).toBeTruthy();
  });
});

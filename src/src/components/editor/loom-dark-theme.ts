/**
 * Loom Dark Theme -- CodeMirror 6 theme using OKLCH design tokens.
 *
 * Uses EditorView.theme() with CSS var() references to tokens.css variables,
 * keeping the editor in sync with the design system at runtime.
 *
 * HighlightStyle maps lezer tags to --shiki-token-* vars for syntax coloring.
 *
 * Constitution: Named exports (2.2), design tokens only (7.14).
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const loomEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--code-surface)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      caretColor: 'var(--accent-primary)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--accent-primary)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--accent-primary-muted)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--surface-base)',
      color: 'var(--text-muted)',
      borderRight: '1px solid var(--border-subtle)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--surface-active)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--surface-active)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'oklch(0.72 0.14 70 / 0.3)',
      outline: '1px solid oklch(0.72 0.14 70 / 0.5)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'oklch(0.72 0.14 70 / 0.5)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--surface-overlay)',
      color: 'var(--text-muted)',
      border: 'none',
    },
  },
  { dark: true },
);

const loomHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--shiki-token-keyword)' },
  { tag: tags.string, color: 'var(--shiki-token-string)' },
  { tag: tags.regexp, color: 'var(--shiki-token-string)' },
  { tag: tags.comment, color: 'var(--shiki-token-comment)', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: 'var(--shiki-token-function)' },
  { tag: tags.definition(tags.variableName), color: 'var(--shiki-token-function)' },
  { tag: tags.number, color: 'var(--shiki-token-constant)' },
  { tag: tags.bool, color: 'var(--shiki-token-constant)' },
  { tag: tags.operator, color: 'var(--shiki-token-punctuation)' },
  { tag: tags.typeName, color: 'var(--shiki-token-parameter)' },
  { tag: tags.propertyName, color: 'var(--shiki-token-parameter)' },
  { tag: tags.className, color: 'var(--shiki-token-parameter)' },
  { tag: tags.link, color: 'var(--accent-primary)', textDecoration: 'underline' },
]);

/** Combined theme extension: editor chrome + syntax highlighting */
export const loomDarkTheme = [loomEditorTheme, syntaxHighlighting(loomHighlightStyle)];

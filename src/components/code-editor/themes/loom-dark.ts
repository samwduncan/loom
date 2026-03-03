/**
 * Custom CodeMirror 6 dark theme — Catppuccin Mocha tokens on charcoal base.
 *
 * Combines editor chrome styling (EditorView.theme) with syntax highlighting
 * (HighlightStyle.define) using the shared Catppuccin Mocha palette. Token
 * colors are identical to the Shiki catppuccin-mocha theme for visual
 * consistency between the file editor and chat code blocks.
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';
import { catppuccinMocha, syntaxColors } from '../../../shared/catppuccin-mocha';

// ── Editor Chrome Theme ────────────────────────────────────────────────────────

const loomEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: catppuccinMocha.base,
    color: catppuccinMocha.text,
  },
  '.cm-content': {
    caretColor: catppuccinMocha.rosewater,
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: catppuccinMocha.rosewater,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: catppuccinMocha.surface2 + '60',
  },
  '.cm-panels': {
    backgroundColor: catppuccinMocha.mantle,
    color: catppuccinMocha.text,
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: `1px solid ${catppuccinMocha.surface0}`,
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: `1px solid ${catppuccinMocha.surface0}`,
  },
  '.cm-searchMatch': {
    backgroundColor: catppuccinMocha.surface2 + '40',
    outline: `1px solid ${catppuccinMocha.surface2}`,
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: catppuccinMocha.surface2 + '80',
  },
  '.cm-activeLine': {
    backgroundColor: catppuccinMocha.surface0 + '40',
  },
  '.cm-selectionMatch': {
    backgroundColor: catppuccinMocha.surface2 + '30',
  },
  '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
    outline: `1px solid ${catppuccinMocha.surface2}`,
  },
  '&.cm-focused .cm-matchingBracket': {
    color: catppuccinMocha.green,
    fontWeight: 'bold',
  },
  '.cm-gutters': {
    backgroundColor: catppuccinMocha.mantle,
    color: catppuccinMocha.overlay0,
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: catppuccinMocha.surface0 + '60',
    color: catppuccinMocha.subtext0,
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: catppuccinMocha.overlay1,
  },
  '.cm-tooltip': {
    border: `1px solid ${catppuccinMocha.surface0}`,
    backgroundColor: catppuccinMocha.surface0,
    color: catppuccinMocha.text,
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: catppuccinMocha.surface0,
    borderBottomColor: catppuccinMocha.surface0,
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: catppuccinMocha.surface1,
      color: catppuccinMocha.text,
    },
  },
}, { dark: true });

// ── Syntax Highlighting ────────────────────────────────────────────────────────

const loomHighlightStyle = HighlightStyle.define([
  // Keywords
  { tag: tags.keyword, color: syntaxColors.keyword },
  { tag: tags.controlKeyword, color: syntaxColors.controlFlow },
  { tag: tags.operatorKeyword, color: syntaxColors.keyword },
  { tag: tags.definitionKeyword, color: syntaxColors.keyword },
  { tag: tags.moduleKeyword, color: syntaxColors.keyword },

  // Operators
  { tag: tags.operator, color: syntaxColors.operator },
  { tag: tags.derefOperator, color: syntaxColors.punctuation },
  { tag: tags.arithmeticOperator, color: syntaxColors.operator },
  { tag: tags.logicOperator, color: syntaxColors.operator },
  { tag: tags.bitwiseOperator, color: syntaxColors.operator },
  { tag: tags.compareOperator, color: syntaxColors.operator },
  { tag: tags.updateOperator, color: syntaxColors.operator },

  // Comments
  { tag: tags.comment, color: syntaxColors.comment, fontStyle: 'italic' },
  { tag: tags.lineComment, color: syntaxColors.comment, fontStyle: 'italic' },
  { tag: tags.blockComment, color: syntaxColors.comment, fontStyle: 'italic' },
  { tag: tags.docComment, color: syntaxColors.comment, fontStyle: 'italic' },

  // Strings
  { tag: tags.string, color: syntaxColors.string },
  { tag: tags.special(tags.string), color: syntaxColors.string },
  { tag: tags.docString, color: syntaxColors.string },
  { tag: tags.character, color: syntaxColors.string },
  { tag: tags.escape, color: catppuccinMocha.pink },
  { tag: tags.regexp, color: syntaxColors.regex },

  // Numbers and constants
  { tag: tags.number, color: syntaxColors.number },
  { tag: tags.integer, color: syntaxColors.number },
  { tag: tags.float, color: syntaxColors.number },
  { tag: tags.bool, color: syntaxColors.constant },
  { tag: tags.null, color: syntaxColors.constant },
  { tag: tags.atom, color: syntaxColors.constant },
  { tag: tags.self, color: catppuccinMocha.red },

  // Variables
  { tag: tags.variableName, color: syntaxColors.variable },
  { tag: tags.definition(tags.variableName), color: catppuccinMocha.lavender },
  { tag: tags.special(tags.variableName), color: catppuccinMocha.maroon },

  // Functions
  { tag: tags.function(tags.variableName), color: syntaxColors.function },
  { tag: tags.function(tags.propertyName), color: syntaxColors.function },

  // Types
  { tag: tags.typeName, color: syntaxColors.type },
  { tag: tags.className, color: syntaxColors.type },
  { tag: tags.namespace, color: syntaxColors.type },

  // Properties
  { tag: tags.propertyName, color: syntaxColors.property },
  { tag: tags.definition(tags.propertyName), color: syntaxColors.property },

  // Tags (HTML/XML)
  { tag: tags.tagName, color: syntaxColors.tag },
  { tag: tags.attributeName, color: syntaxColors.attribute },
  { tag: tags.attributeValue, color: syntaxColors.string },

  // Punctuation
  { tag: tags.angleBracket, color: syntaxColors.punctuation },
  { tag: tags.bracket, color: syntaxColors.punctuation },
  { tag: tags.paren, color: syntaxColors.punctuation },
  { tag: tags.squareBracket, color: syntaxColors.punctuation },
  { tag: tags.brace, color: syntaxColors.punctuation },
  { tag: tags.separator, color: syntaxColors.punctuation },
  { tag: tags.punctuation, color: syntaxColors.punctuation },

  // Meta/special
  { tag: tags.meta, color: catppuccinMocha.pink },
  { tag: tags.processingInstruction, color: catppuccinMocha.pink },
  { tag: tags.annotation, color: catppuccinMocha.pink },
  { tag: tags.labelName, color: catppuccinMocha.sapphire },

  // Markup
  { tag: tags.heading, color: catppuccinMocha.red, fontWeight: 'bold' },
  { tag: tags.heading1, color: catppuccinMocha.red, fontWeight: 'bold' },
  { tag: tags.heading2, color: catppuccinMocha.peach, fontWeight: 'bold' },
  { tag: tags.heading3, color: catppuccinMocha.yellow, fontWeight: 'bold' },
  { tag: tags.link, color: catppuccinMocha.sapphire, textDecoration: 'underline' },
  { tag: tags.url, color: catppuccinMocha.sapphire, textDecoration: 'underline' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },

  // Invalid
  { tag: tags.invalid, color: catppuccinMocha.red, textDecoration: 'line-through' },
]);

// ── Combined Theme Extension ───────────────────────────────────────────────────

export const loomDarkTheme: Extension = [
  loomEditorTheme,
  syntaxHighlighting(loomHighlightStyle),
];

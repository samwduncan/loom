/**
 * rehype-tool-markers — unit tests for hast tree transformation.
 *
 * Tests the plugin directly on hast trees: creates minimal Root nodes
 * with text children containing \x00TOOL:id\x00 markers and verifies
 * the tree is correctly transformed.
 */

import { describe, it, expect } from 'vitest';
import { rehypeToolMarkers } from './rehype-tool-markers';
import type { Root, Element, Text } from 'hast';

function text(value: string): Text {
  return { type: 'text', value };
}

function element(tag: string, children: (Element | Text)[]): Element {
  return { type: 'element', tagName: tag, properties: {}, children };
}

function root(children: (Element | Text)[]): Root {
  return { type: 'root', children };
}

function runPlugin(tree: Root): Root {
  const plugin = rehypeToolMarkers();
  plugin(tree);
  return tree;
}

describe('rehypeToolMarkers', () => {
  it('replaces a single marker in a text node', () => {
    const tree = root([
      element('p', [text('before \x00TOOL:abc123\x00 after')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    expect(p.children).toHaveLength(3);
    expect((p.children[0] as Text).value).toBe('before ');
    expect((p.children[1] as Element).tagName).toBe('tool-marker');
    expect((p.children[1] as Element).properties['data-id']).toBe('abc123');
    expect((p.children[2] as Text).value).toBe(' after');
  });

  it('replaces multiple markers in the same text node', () => {
    const tree = root([
      element('p', [text('\x00TOOL:first\x00 middle \x00TOOL:second\x00')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    // Empty text nodes at start/end are filtered out
    expect(p.children).toHaveLength(3);
    expect((p.children[0] as Element).tagName).toBe('tool-marker');
    expect((p.children[0] as Element).properties['data-id']).toBe('first');
    expect((p.children[1] as Text).value).toBe(' middle ');
    expect((p.children[2] as Element).tagName).toBe('tool-marker');
    expect((p.children[2] as Element).properties['data-id']).toBe('second');
  });

  it('leaves text nodes without markers unchanged', () => {
    const tree = root([
      element('p', [text('no markers here')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    expect(p.children).toHaveLength(1);
    expect((p.children[0] as Text).value).toBe('no markers here');
  });

  it('handles marker at start of text', () => {
    const tree = root([
      element('p', [text('\x00TOOL:start\x00 rest of text')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    // Should produce: [tool-marker, text(" rest of text")]
    // Leading empty text node should be omitted
    const nonEmptyChildren = p.children.filter(
      (c) => c.type !== 'text' || (c as Text).value !== '',
    );
    expect(nonEmptyChildren.length).toBeGreaterThanOrEqual(2);
    expect((nonEmptyChildren[0] as Element).tagName).toBe('tool-marker');
  });

  it('handles marker at end of text', () => {
    const tree = root([
      element('p', [text('text before \x00TOOL:end\x00')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    const nonEmptyChildren = p.children.filter(
      (c) => c.type !== 'text' || (c as Text).value !== '',
    );
    expect(nonEmptyChildren.length).toBeGreaterThanOrEqual(2);
    const lastMeaningful = nonEmptyChildren[nonEmptyChildren.length - 1];
    // Last meaningful node should be the tool-marker (trailing text is empty)
    expect((lastMeaningful as Element).tagName).toBe('tool-marker');
  });

  it('handles markers in nested elements', () => {
    const tree = root([
      element('div', [
        element('p', [text('outer')]),
        element('blockquote', [
          element('p', [text('inner \x00TOOL:nested\x00 text')]),
        ]),
      ]),
    ]);

    runPlugin(tree);

    const blockquote = (tree.children[0] as Element).children[1] as Element;
    const innerP = blockquote.children[0] as Element;
    expect(innerP.children).toHaveLength(3);
    expect((innerP.children[1] as Element).tagName).toBe('tool-marker');
    expect((innerP.children[1] as Element).properties['data-id']).toBe('nested');
  });

  it('handles markers in separate text nodes across the tree', () => {
    const tree = root([
      element('p', [text('first \x00TOOL:a\x00')]),
      element('p', [text('second \x00TOOL:b\x00')]),
    ]);

    runPlugin(tree);

    const p1 = tree.children[0] as Element;
    const p2 = tree.children[1] as Element;

    const markers1 = p1.children.filter(
      (c) => c.type === 'element' && (c as Element).tagName === 'tool-marker',
    );
    const markers2 = p2.children.filter(
      (c) => c.type === 'element' && (c as Element).tagName === 'tool-marker',
    );

    expect(markers1).toHaveLength(1);
    expect(markers2).toHaveLength(1);
    expect((markers1[0] as Element).properties['data-id']).toBe('a');
    expect((markers2[0] as Element).properties['data-id']).toBe('b');
  });

  it('creates tool-marker elements with empty children array', () => {
    const tree = root([
      element('p', [text('\x00TOOL:test\x00')]),
    ]);

    runPlugin(tree);

    const p = tree.children[0] as Element;
    const marker = p.children.find(
      (c) => c.type === 'element' && (c as Element).tagName === 'tool-marker',
    ) as Element;
    expect(marker).toBeDefined();
    expect(marker.children).toHaveLength(0);
  });
});

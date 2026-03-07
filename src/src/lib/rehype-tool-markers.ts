/**
 * rehypeToolMarkers — rehype plugin for tool chip marker interleaving.
 *
 * Walks the hast tree looking for text nodes containing null-byte delimited
 * tool markers: \x00TOOL:id\x00. Each marker is replaced with a
 * <tool-marker data-id="id" /> element, splitting the surrounding text
 * into separate text nodes.
 *
 * Usage in react-markdown:
 *   rehypePlugins={[rehypeRaw, rehypeToolMarkers]}
 *
 * The tool-marker elements are then rendered via react-markdown's
 * component override system.
 *
 * Constitution: Named exports (2.2), pure function (no side effects).
 */

import { visit, SKIP } from 'unist-util-visit';
import type { Root, Text, Element, ElementContent } from 'hast';

// Match both raw null bytes (\x00) and U+FFFD replacement characters.
// HTML spec replaces null bytes with U+FFFD during parsing, so by the time
// rehype sees the hast tree, markers may use either character.
// eslint-disable-next-line no-control-regex -- null byte delimiters are intentional marker protocol
const MARKER_REGEX = /[\x00\uFFFD]TOOL:([^\x00\uFFFD]+)[\x00\uFFFD]/;

/**
 * rehype plugin that replaces \x00TOOL:id\x00 markers in text nodes
 * with <tool-marker data-id="id" /> hast elements.
 */
export function rehypeToolMarkers() {
  return function transformer(tree: Root): void {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || index === null || !parent) return;
      if (!MARKER_REGEX.test(node.value)) return;

      const replacements: ElementContent[] = [];
      let remaining = node.value;

      while (remaining.length > 0) {
        const match = MARKER_REGEX.exec(remaining);
        if (!match) {
          // No more markers — push remaining text
          replacements.push({ type: 'text', value: remaining });
          break;
        }

        const toolId = match[1];
        const before = remaining.slice(0, match.index);
        const after = remaining.slice(match.index + match[0].length);

        // Push text before marker
        replacements.push({ type: 'text', value: before });

        // Push tool-marker element if valid ID
        if (toolId && toolId.length > 0) {
          const markerElement: Element = {
            type: 'element',
            tagName: 'tool-marker',
            properties: { 'data-id': toolId },
            children: [],
          };
          replacements.push(markerElement);
        }

        remaining = after;
      }

      // Filter out empty text nodes for cleanliness
      const filtered = replacements.filter(
        (r) => r.type !== 'text' || (r as Text).value !== '',
      );

      // Splice replacements into parent's children, replacing the original text node
      parent.children.splice(index, 1, ...filtered);

      return SKIP;
    });
  };
}

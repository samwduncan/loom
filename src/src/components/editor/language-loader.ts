/**
 * Language Loader -- dynamic CodeMirror language loading by filename.
 *
 * Uses @codemirror/language-data's built-in language registry to match
 * file extensions to language grammars. Loading is lazy (grammar bundles
 * are code-split by the library).
 *
 * Cache is handled internally by @codemirror/language-data -- no manual
 * caching needed.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { type LanguageSupport } from '@codemirror/language';
import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

/**
 * Loads the appropriate language support for a given filename.
 * Returns the LanguageSupport extension, or null if no match found.
 */
export async function loadLanguageForFile(
  filename: string,
): Promise<LanguageSupport | null> {
  const desc = LanguageDescription.matchFilename(languages, filename);
  if (!desc) return null;

  try {
    await desc.load();
    return desc.support ?? null;
  } catch {
    // Grammar failed to load -- degrade gracefully to plain text
    return null;
  }
}

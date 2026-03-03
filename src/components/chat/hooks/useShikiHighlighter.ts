/**
 * Singleton Shiki highlighter with Catppuccin Mocha theme.
 *
 * Uses the web bundle (~3.8 MB) instead of the full bundle (~6.4 MB).
 * Languages are loaded lazily on first use; the highlighter instance
 * and its WASM engine are created exactly once.
 *
 * Catppuccin Mocha is a bundled Shiki theme. We warm-shift only the
 * base/surface/text colors via colorReplacements so backgrounds blend
 * with the app's charcoal palette. Token/accent colors stay pure Catppuccin.
 */

import { catppuccinMocha, shikiBaseReplacements } from '../../../shared/catppuccin-mocha';

// We use a loose `Highlighter` interface because the web bundle's
// BundledLanguage type is narrower than the full bundle's type that
// TypeScript resolves when importing from 'shiki'.  Keeping it loose
// avoids generic-mismatch errors while retaining full runtime safety.
interface Highlighter {
  codeToHtml(code: string, options: {
    lang: string;
    theme: string;
    colorReplacements?: Record<string, string>;
  }): string;
  getLoadedLanguages(): string[];
}

// ---- singleton promise ----
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Returns the singleton highlighter instance, creating it on first call.
 * Safe to call from multiple components concurrently — all will await
 * the same promise.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      // Dynamic import keeps the web bundle out of the main chunk
      const { createHighlighter } = await import('shiki/bundle/web');

      const highlighter = await createHighlighter({
        themes: ['catppuccin-mocha'],
        langs: [
          'javascript',
          'typescript',
          'python',
          'json',
          'html',
          'css',
          'shellscript', // aliases: bash, sh, shell, zsh
          'markdown',
          'jsx',
          'tsx',
          'yaml',
          'sql',
          'java',
          'c',
          'cpp',
          'graphql',
          'xml',
        ],
      });

      return highlighter;
    })();
  }
  return highlighterPromise;
}

/**
 * Highlight a code string and return an HTML string.
 *
 * Falls back to `text` (plain tokens) when the requested language
 * is not available in the web bundle.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();

  // Normalise common aliases not handled by Shiki's own alias map
  const langMap: Record<string, string> = {
    sh: 'shellscript',
    zsh: 'shellscript',
    yml: 'yaml',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
  };
  const resolved = langMap[lang] || lang;

  // Check if the language is loaded; fall back to plaintext if not
  const loadedLangs = highlighter.getLoadedLanguages();
  const safeLang = loadedLangs.includes(resolved) ? resolved : 'text';

  try {
    return highlighter.codeToHtml(code, {
      lang: safeLang,
      theme: 'catppuccin-mocha',
      colorReplacements: shikiBaseReplacements,
    });
  } catch {
    // Absolute fallback — return escaped plain text
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre style="background:${catppuccinMocha.mantle};color:${catppuccinMocha.text};padding:1rem;border-radius:0.5rem;overflow-x:auto"><code>${escaped}</code></pre>`;
  }
}

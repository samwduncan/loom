/**
 * Singleton Shiki highlighter with warm Dark+ color replacements.
 *
 * Uses the web bundle (~3.8 MB) instead of the full bundle (~6.4 MB).
 * Languages are loaded lazily on first use; the highlighter instance
 * and its WASM engine are created exactly once.
 */

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

// ---- warm Dark+ color replacements ----
// Maps exact VS Code Dark+ hex values to warm Loom equivalents
const WARM_COLOR_REPLACEMENTS: Record<string, string> = {
  '#1E1E1E': '#1c1210', // background -> Loom base
  '#D4D4D4': '#f5e6d3', // foreground -> Loom cream
  '#264F78': '#3d2e25', // selection -> warm selection
  '#808080': '#c4a882', // comments -> muted gold
  '#569CD6': '#6bacce', // keywords -> slightly warmer blue
  '#4EC9B0': '#5cc0a0', // types -> slightly warmer teal
  '#CE9178': '#d4a574', // strings -> Loom amber
  '#DCDCAA': '#e0d0a0', // functions -> warmer yellow
  '#9CDCFE': '#a0ccde', // variables -> warmer light blue
  '#C586C0': '#c48aab', // control flow -> warmer mauve
  '#6A9955': '#7a9960', // comments green -> warmer green
  '#B5CEA8': '#c0c8a0', // numbers -> warmer green
};

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
        themes: ['dark-plus'],
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
      theme: 'dark-plus',
      colorReplacements: WARM_COLOR_REPLACEMENTS,
    });
  } catch {
    // Absolute fallback — return escaped plain text
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre style="background:#1c1210;color:#f5e6d3;padding:1rem;border-radius:0.5rem;overflow-x:auto"><code>${escaped}</code></pre>`;
  }
}

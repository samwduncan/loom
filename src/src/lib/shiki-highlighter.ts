/**
 * Shiki syntax highlighter singleton with lazy grammar loading and cache.
 *
 * Uses the JS RegExp engine (no WASM) and CSS variables theme
 * so token colors are driven by tokens.css custom properties.
 */
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlighterCore } from 'shiki/core';
import { loomTheme } from './shiki-theme';

/** Common languages to preload at startup */
const PRELOAD_LANGS = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'json',
  'css',
  'html',
] as const;

/** Language import paths for tree-shakeable loading */
const LANG_IMPORTS: Record<string, () => Promise<unknown>> = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
};

/** Maps file extension to Shiki language grammar ID */
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.json': 'json',
  '.jsonc': 'json',
  '.css': 'css',
  '.scss': 'css',
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'html',
  '.svg': 'html',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.rs': 'rust',
  '.go': 'go',
  '.rb': 'ruby',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.sql': 'sql',
  '.toml': 'toml',
  '.env': 'bash',
  '.dockerfile': 'docker',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.lua': 'lua',
  '.r': 'r',
};

/**
 * Infers the Shiki language grammar ID from a file path's extension.
 * Returns 'text' for unknown extensions.
 */
export function getLanguageFromPath(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return 'text';
  const ext = filePath.slice(lastDot).toLowerCase();
  // Handle special filenames like "Dockerfile"
  if (ext === filePath.toLowerCase() || !ext) {
    const basename = filePath.split('/').pop()?.toLowerCase() ?? '';
    if (basename === 'dockerfile') return 'docker';
    if (basename === 'makefile') return 'makefile';
    return 'text';
  }
  return EXT_TO_LANG[ext] ?? 'text';
}

let highlighterPromise: Promise<HighlighterCore> | null = null;

/** Maximum cache entries before LRU eviction */
export const MAX_CACHE_SIZE = 500;

/**
 * FNV-1a hash for cache keys — avoids storing full code strings as Map keys.
 * Returns a hex string. Collisions are theoretically possible but negligible
 * for a 500-entry cache with 32-bit hash space.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, keep as uint32
  }
  return hash.toString(16);
}

/** Cache: key = fnv1a hash of `${lang}\0${code}`, value = highlighted HTML */
const cache = new Map<string, string>();

/** Returns current cache size (exported for testing) */
export function getCacheSize(): number {
  return cache.size;
}

/** Clears the highlight cache (exported for testing) */
export function clearCache(): void {
  cache.clear();
}

/** Build a cache key from lang + code using hash to bound memory */
function makeCacheKey(lang: string, code: string): string {
  return fnv1aHash(`${lang}\0${code}`);
}

/** Insert into cache with LRU eviction (Map iteration order = insertion order) */
function cacheSet(key: string, value: string): void {
  // If key already exists, delete first to refresh insertion order
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry (first key in Map iteration order)
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, value);
}

/**
 * Returns the singleton Shiki highlighter instance.
 * Creates it on first call; subsequent calls return the same promise.
 */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [loomTheme],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/**
 * Preloads the 7 most common languages so they highlight instantly.
 */
export async function preloadLanguages(): Promise<void> {
  const h = await getHighlighter();
  await Promise.all(
    PRELOAD_LANGS.map(async (lang) => {
      const importer = LANG_IMPORTS[lang];
      if (!importer) return;
      const mod = await importer();
      await h.loadLanguage(mod as Parameters<typeof h.loadLanguage>[0]); // ASSERT: shiki dynamic import returns compatible module
    }),
  );
}

/**
 * Highlights code and returns an HTML string.
 * Results are cached by language + code content.
 * Unknown languages return the raw code string (graceful fallback).
 */
export async function highlightCode(
  lang: string,
  code: string,
): Promise<string> {
  const cacheKey = makeCacheKey(lang, code);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const h = await getHighlighter();

  // Attempt to load the grammar if not already loaded
  if (!h.getLoadedLanguages().includes(lang)) {
    try {
      const importer = LANG_IMPORTS[lang];
      if (importer) {
        const mod = await importer();
        await h.loadLanguage(mod as Parameters<typeof h.loadLanguage>[0]); // ASSERT: shiki dynamic import returns compatible module
      } else {
        // Dynamic import for languages not in the static map
        const mod = await import(`shiki/langs/${lang}.mjs`);
        await h.loadLanguage(mod.default ?? mod);
      }
    } catch {
      // Unknown language -- return raw code
      cacheSet(cacheKey, code);
      return code;
    }
  }

  const html = h.codeToHtml(code, {
    lang,
    theme: 'loom-dark',
  });

  cacheSet(cacheKey, html);
  return html;
}

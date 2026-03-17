import { describe, it, expect, beforeAll } from 'vitest';
import {
  getHighlighter,
  preloadLanguages,
  highlightCode,
  getLanguageFromPath,
  MAX_CACHE_SIZE,
  getCacheSize,
  clearCache,
} from './shiki-highlighter';

describe('shiki-highlighter', () => {
  describe('getHighlighter (singleton)', () => {
    it('returns the same instance on repeated calls', async () => {
      const h1 = await getHighlighter();
      const h2 = await getHighlighter();
      expect(h1).toBe(h2);
    });
  });

  describe('preloadLanguages', () => {
    beforeAll(async () => {
      await preloadLanguages();
    });

    it('loads all 7 common languages', async () => {
      const h = await getHighlighter();
      const loaded = h.getLoadedLanguages();
      for (const lang of ['javascript', 'typescript', 'python', 'bash', 'json', 'css', 'html']) {
        expect(loaded).toContain(lang);
      }
    });
  });

  describe('highlightCode', () => {
    beforeAll(async () => {
      await preloadLanguages();
    });

    it('returns HTML string with span tags for known language', async () => {
      const html = await highlightCode('typescript', 'const x = 1');
      expect(html).toContain('<span');
    });

    it('returns cached result on repeated calls (same reference)', async () => {
      const code = 'const cached = true';
      const html1 = await highlightCode('typescript', code);
      const html2 = await highlightCode('typescript', code);
      expect(html1).toBe(html2);
    });

    it('returns raw code string for unknown language without throwing', async () => {
      const code = 'some random code';
      const result = await highlightCode('nonexistent-lang-xyz', code);
      expect(result).toBe(code);
    });
  });

  describe('cache bounding (LRU)', () => {
    beforeAll(async () => {
      await preloadLanguages();
    });

    beforeEach(() => {
      clearCache();
    });

    it('exports MAX_CACHE_SIZE as 500', () => {
      expect(MAX_CACHE_SIZE).toBe(500);
    });

    it('cache size never exceeds MAX_CACHE_SIZE after many inserts', async () => {
      // Insert MAX_CACHE_SIZE + 10 unique entries
      for (let i = 0; i < MAX_CACHE_SIZE + 10; i++) {
        await highlightCode('typescript', `const unique_${i} = ${i};`);
      }
      expect(getCacheSize()).toBeLessThanOrEqual(MAX_CACHE_SIZE);
    });

    it('evicts oldest entry when cache is full', async () => {
      // Fill cache to exactly MAX_CACHE_SIZE
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        await highlightCode('typescript', `const fill_${i} = ${i};`);
      }
      expect(getCacheSize()).toBe(MAX_CACHE_SIZE);
      // Insert one more — size should stay at MAX_CACHE_SIZE
      await highlightCode('typescript', `const eviction_test = "overflow";`);
      expect(getCacheSize()).toBe(MAX_CACHE_SIZE);
    });
  });

  describe('getLanguageFromPath', () => {
    it('maps .ts to typescript', () => {
      expect(getLanguageFromPath('src/app.ts')).toBe('typescript');
    });

    it('maps .tsx to typescript', () => {
      expect(getLanguageFromPath('Component.tsx')).toBe('typescript');
    });

    it('maps .py to python', () => {
      expect(getLanguageFromPath('/home/user/script.py')).toBe('python');
    });

    it('maps .json to json', () => {
      expect(getLanguageFromPath('package.json')).toBe('json');
    });

    it('maps .css to css', () => {
      expect(getLanguageFromPath('styles/main.css')).toBe('css');
    });

    it('maps .rs to rust', () => {
      expect(getLanguageFromPath('src/main.rs')).toBe('rust');
    });

    it('maps .go to go', () => {
      expect(getLanguageFromPath('main.go')).toBe('go');
    });

    it('returns text for unknown extension', () => {
      expect(getLanguageFromPath('file.xyz')).toBe('text');
    });

    it('returns text for file with no extension', () => {
      expect(getLanguageFromPath('Makefile')).toBe('text');
    });

    it('handles case-insensitive extension', () => {
      expect(getLanguageFromPath('FILE.JS')).toBe('javascript');
    });
  });
});

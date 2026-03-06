/**
 * Tool registry tests — covers COMP-01 requirement.
 * Tests all 6 registered tools, default fallback, chip label extraction,
 * and graceful handling of missing input fields.
 */

import { describe, it, expect } from 'vitest';
import {
  getToolConfig,
  getRegisteredToolNames,
} from '@/lib/tool-registry';

describe('tool-registry', () => {
  describe('getRegisteredToolNames', () => {
    it('returns all 6 registered tool names', () => {
      const names = getRegisteredToolNames();
      expect(names).toContain('Bash');
      expect(names).toContain('Read');
      expect(names).toContain('Edit');
      expect(names).toContain('Write');
      expect(names).toContain('Glob');
      expect(names).toContain('Grep');
      expect(names).toHaveLength(6);
    });
  });

  describe('registered tools', () => {
    it('getToolConfig("Bash") returns config with correct displayName', () => {
      const config = getToolConfig('Bash');
      expect(config.displayName).toBe('Bash');
    });

    it('getToolConfig("Bash") getChipLabel extracts command truncated to ~40 chars', () => {
      const config = getToolConfig('Bash');
      const shortCmd = 'ls -la';
      expect(config.getChipLabel({ command: shortCmd })).toBe(shortCmd);

      const longCmd = 'npm run build && npm run test && npm run lint && npm run deploy';
      const label = config.getChipLabel({ command: longCmd });
      expect(label.length).toBeLessThanOrEqual(40);
      expect(label).toMatch(/\.\.\.$/);
    });

    it('getToolConfig("Read") returns config with getChipLabel extracting file_path', () => {
      const config = getToolConfig('Read');
      expect(config.displayName).toBe('Read');
      const label = config.getChipLabel({ file_path: 'src/app.ts' });
      expect(label).toBe('src/app.ts');
    });

    it('getToolConfig("Read") left-truncates long paths with ... prefix', () => {
      const config = getToolConfig('Read');
      const longPath = '/home/user/projects/very-long-project-name/src/components/deeply/nested/file.tsx';
      const label = config.getChipLabel({ file_path: longPath });
      expect(label.length).toBeLessThanOrEqual(40);
      expect(label).toMatch(/^\.\.\./);
    });

    it('getToolConfig("Edit") returns config with getChipLabel extracting file_path', () => {
      const config = getToolConfig('Edit');
      expect(config.displayName).toBe('Edit');
      const label = config.getChipLabel({ file_path: 'src/utils.ts' });
      expect(label).toBe('src/utils.ts');
    });

    it('getToolConfig("Write") returns config with getChipLabel extracting file_path', () => {
      const config = getToolConfig('Write');
      expect(config.displayName).toBe('Write');
      const label = config.getChipLabel({ file_path: 'src/new-file.ts' });
      expect(label).toBe('src/new-file.ts');
    });

    it('getToolConfig("Glob") returns config with getChipLabel extracting pattern', () => {
      const config = getToolConfig('Glob');
      expect(config.displayName).toBe('Glob');
      const label = config.getChipLabel({ pattern: '**/*.tsx' });
      expect(label).toBe('**/*.tsx');
    });

    it('getToolConfig("Grep") returns config with getChipLabel extracting pattern', () => {
      const config = getToolConfig('Grep');
      expect(config.displayName).toBe('Grep');
      const label = config.getChipLabel({ pattern: 'TODO|FIXME' });
      expect(label).toBe('TODO|FIXME');
    });

    it('each registered tool has an icon component', () => {
      const names = getRegisteredToolNames();
      for (const name of names) {
        const config = getToolConfig(name);
        expect(config.icon).toBeDefined();
        expect(typeof config.icon).toBe('function');
      }
    });

    it('each registered tool has a renderCard component', () => {
      const names = getRegisteredToolNames();
      for (const name of names) {
        const config = getToolConfig(name);
        expect(config.renderCard).toBeDefined();
        expect(typeof config.renderCard).toBe('function');
      }
    });
  });

  describe('default fallback', () => {
    it('getToolConfig("UnknownTool") returns default config with displayName "UnknownTool"', () => {
      const config = getToolConfig('UnknownTool');
      expect(config.displayName).toBe('UnknownTool');
    });

    it('getToolConfig("UnknownTool") returns a default icon and renderCard', () => {
      const config = getToolConfig('UnknownTool');
      expect(typeof config.icon).toBe('function');
      expect(typeof config.renderCard).toBe('function');
    });

    it('getToolConfig("UnknownTool") default chip label returns JSON snippet', () => {
      const config = getToolConfig('UnknownTool');
      const label = config.getChipLabel({ foo: 'bar' });
      expect(label).toBe('{"foo":"bar"}');
    });

    it('getToolConfig("UnknownTool") truncates long JSON chip labels', () => {
      const config = getToolConfig('UnknownTool');
      const bigInput = { key: 'a'.repeat(100) };
      const label = config.getChipLabel(bigInput);
      expect(label.length).toBeLessThanOrEqual(40);
      expect(label).toMatch(/\.\.\.$/);
    });

    it('getToolConfig("AnotherUnknown") returns fresh default config (not cached)', () => {
      const config1 = getToolConfig('UnknownTool');
      const config2 = getToolConfig('AnotherUnknown');
      expect(config2.displayName).toBe('AnotherUnknown');
      expect(config1).not.toBe(config2);
    });
  });

  describe('graceful handling of missing input fields', () => {
    it('Bash getChipLabel handles missing command field', () => {
      const config = getToolConfig('Bash');
      const label = config.getChipLabel({});
      expect(label).toBe('Bash');
    });

    it('Read getChipLabel handles missing file_path field', () => {
      const config = getToolConfig('Read');
      const label = config.getChipLabel({});
      expect(label).toBe('Read');
    });

    it('Glob getChipLabel handles missing pattern field', () => {
      const config = getToolConfig('Glob');
      const label = config.getChipLabel({});
      expect(label).toBe('Glob');
    });

    it('Grep getChipLabel handles missing pattern field', () => {
      const config = getToolConfig('Grep');
      const label = config.getChipLabel({});
      expect(label).toBe('Grep');
    });

    it('all getChipLabel functions handle non-string input values', () => {
      const names = getRegisteredToolNames();
      for (const name of names) {
        const config = getToolConfig(name);
        // Passing number instead of string should not crash
        expect(() => config.getChipLabel({ command: 42, file_path: null, pattern: undefined })).not.toThrow();
      }
    });
  });
});

/**
 * CodeEditor tests -- minimap extension presence and configuration.
 *
 * Strategy: Mock @uiw/react-codemirror to capture the `extensions` prop.
 * Verify that showMinimap.compute is included in the extensions array.
 * Actual canvas rendering is untestable in jsdom.
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track extensions passed to CodeMirror
let capturedExtensions: unknown[] = [];

vi.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: (props: { extensions?: unknown[] }) => {
    capturedExtensions = props.extensions ?? [];
    return <div data-testid="codemirror-mock" />;
  },
}));

// Mock showMinimap so we can identify it in the extensions array
const mockMinimapExtension = Symbol('minimap-extension');
vi.mock('@replit/codemirror-minimap', () => ({
  showMinimap: {
    compute: vi.fn(() => mockMinimapExtension),
  },
}));

// Mock hooks and stores
vi.mock('@/hooks/useFileContent', () => ({
  useFileContent: () => ({
    content: 'const x = 1;',
    loading: false,
    error: null,
    isBinary: false,
    isLarge: false,
    proceed: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFileSave', () => ({
  useFileSave: () => ({ save: vi.fn().mockResolvedValue(true) }),
}));

vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project' }),
}));

let mockActiveFilePath: string | null = '/src/index.ts';

vi.mock('@/stores/file', () => ({
  useFileStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        activeFilePath: mockActiveFilePath,
        openTabs: mockActiveFilePath
          ? [{ filePath: mockActiveFilePath, isDirty: false, fileSize: 1024 }]
          : [],
        setActiveFile: vi.fn(),
      }),
    { getState: () => ({ activeFilePath: mockActiveFilePath, setDirty: vi.fn() }) },
  ),
}));

vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ theme: { fontSize: 14 } }),
}));

// Mock subcomponents to avoid their dependencies
vi.mock('@/components/editor/EditorBreadcrumb', () => ({
  EditorBreadcrumb: () => <div data-testid="breadcrumb" />,
}));

vi.mock('@/components/editor/loom-dark-theme', () => ({
  loomDarkTheme: [],
}));

vi.mock('@/components/editor/language-loader', () => ({
  loadLanguageForFile: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/components/editor/content-cache', () => ({
  contentCache: new Map(),
  originalCache: new Map(),
}));

vi.mock('@codemirror/search', () => ({
  search: () => Symbol('search'),
}));

vi.mock('@codemirror/view', () => ({
  EditorView: {
    updateListener: { of: () => Symbol('updateListener') },
    domEventHandlers: () => Symbol('domEventHandlers'),
    lineWrapping: Symbol('lineWrapping'),
  },
  ViewUpdate: {},
}));

vi.mock('@codemirror/state', () => ({
  Extension: {},
}));

// Import after mocks
import { CodeEditor } from './CodeEditor';

describe('CodeEditor minimap', () => {
  beforeEach(() => {
    capturedExtensions = [];
    mockActiveFilePath = '/src/index.ts';
  });

  it('includes minimap extension in CodeMirror extensions array', () => {
    render(<CodeEditor />);
    expect(capturedExtensions).toContain(mockMinimapExtension);
  });

  it('uses showMinimap.compute facet for minimap configuration', async () => {
    const { showMinimap } = await import('@replit/codemirror-minimap');
    render(<CodeEditor />);
    expect(showMinimap.compute).toHaveBeenCalled();
  });
});

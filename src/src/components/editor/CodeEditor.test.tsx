/**
 * CodeEditor tests -- minimap extension presence and configuration.
 *
 * Strategy: Mock @uiw/react-codemirror to capture the `extensions` prop.
 * Verify that showMinimap.compute is included in the extensions array.
 * Actual canvas rendering is untestable in jsdom.
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs before vi.mock hoisting -- safe to reference in mock factories
const { capturedExtensionsRef, MINIMAP_SENTINEL, mockCompute } = vi.hoisted(() => {
  const capturedExtensionsRef = { current: [] as unknown[] };
  const MINIMAP_SENTINEL = '__minimap_extension__';
  const mockCompute = vi.fn(() => MINIMAP_SENTINEL);
  return { capturedExtensionsRef, MINIMAP_SENTINEL, mockCompute };
});

vi.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: (props: { extensions?: unknown[] }) => {
    capturedExtensionsRef.current = props.extensions ?? [];
    return <div data-testid="codemirror-mock" />;
  },
}));

vi.mock('@replit/codemirror-minimap', () => ({
  showMinimap: {
    compute: mockCompute,
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
    capturedExtensionsRef.current = [];
    mockActiveFilePath = '/src/index.ts';
  });

  it('includes minimap extension in CodeMirror extensions array', () => {
    render(<CodeEditor />);
    expect(capturedExtensionsRef.current).toContain(MINIMAP_SENTINEL);
  });

  it('uses showMinimap.compute facet for minimap configuration', () => {
    render(<CodeEditor />);
    expect(mockCompute).toHaveBeenCalled();
  });
});

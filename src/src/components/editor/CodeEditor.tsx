/**
 * CodeEditor -- main CodeMirror 6 wrapper for file editing.
 *
 * Lazy-loaded via React.lazy() with named export remapping pattern
 * (see AppShell.tsx). Renders syntax-highlighted code with OKLCH theme,
 * dynamic language loading, Cmd+S save, word wrap toggle.
 *
 * Guards: binary files show BinaryPlaceholder, large files show LargeFileWarning.
 * Empty state: no active file shows prompt to open from tree or Cmd+K.
 *
 * Constitution: Named export (2.2), selector hooks (4.2),
 * design tokens (7.14), no inline styles.
 */

import { useCallback, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { type Extension } from '@codemirror/state';
import { type ViewUpdate } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { search } from '@codemirror/search';
import { Keyboard, WrapText } from 'lucide-react';

import { loomDarkTheme } from '@/components/editor/loom-dark-theme';
import { minimapExtension } from '@/components/editor/minimap-extension';
import { loadLanguageForFile } from '@/components/editor/language-loader';
import { useFileContent } from '@/hooks/useFileContent';
import { useFileSave } from '@/hooks/useFileSave';
import { useFileStore } from '@/stores/file';
import { useUIStore } from '@/stores/ui';
import { useProjectContext } from '@/hooks/useProjectContext';
import { EditorBreadcrumb } from '@/components/editor/EditorBreadcrumb';
import { BinaryPlaceholder } from '@/components/editor/BinaryPlaceholder';
import { LargeFileWarning } from '@/components/editor/LargeFileWarning';
import { contentCache, originalCache } from '@/components/editor/content-cache';
import { Button } from '@/components/ui/button';
import './editor.css';

/**
 * Module-level save function binding for Cmd+S keymap extension.
 * Keyed by mount ID to be StrictMode-safe: each mount/unmount cycle
 * registers and deregisters its own save function. Only the latest
 * registered mount's function is used.
 */
let _saveFn: ((path: string, content: string) => Promise<boolean>) | null = null;
let _saveFnMountId = 0;

const saveKeymapExtension = EditorView.domEventHandlers({
  keydown(event: KeyboardEvent, view: EditorView) {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      const path = useFileStore.getState().activeFilePath; // ASSERT: read in event handler, not render
      if (path && _saveFn) {
        const doc = view.state.doc.toString();
        _saveFn(path, doc);
      }
      return true;
    }
    return false;
  },
});

export function CodeEditor() {
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const activeTab = useFileStore((s) => s.openTabs.find((t) => t.filePath === s.activeFilePath));
  const setActiveFile = useFileStore((s) => s.setActiveFile);
  const { projectName } = useProjectContext();
  const fontSize = useUIStore((s) => s.theme.fontSize);

  const { content, loading, error, isBinary, isLarge, proceed } = useFileContent(
    projectName,
    activeFilePath,
    activeTab?.fileSize,
  );
  const { save } = useFileSave(projectName);

  const [lineWrap, setLineWrap] = useState(false);
  const [langExtension, setLangExtension] = useState<Extension | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [prevFilePath, setPrevFilePath] = useState<string | null>(activeFilePath);

  // Keep module-level save function in sync (StrictMode-safe via mount ID)
  useEffect(() => {
    const id = ++_saveFnMountId;
    _saveFn = save;
    return () => {
      // Only clear if this mount's ID is still current (prevents StrictMode race)
      if (_saveFnMountId === id) _saveFn = null;
    };
  }, [save]);

  // "Adjust state during rendering" -- reset lang extension on path change
  if (activeFilePath !== prevFilePath) {
    setPrevFilePath(activeFilePath);
    setLangExtension(null);
  }

  // Load language grammar when active file changes
  useEffect(() => {
    if (!activeFilePath) return;

    let cancelled = false;
    const filename = activeFilePath.split('/').pop() ?? '';
    loadLanguageForFile(filename).then((ext) => {
      if (!cancelled && ext) setLangExtension(ext);
    });
    return () => { cancelled = true; };
  }, [activeFilePath]);

  // Populate caches when content loads from backend
  useEffect(() => {
    if (activeFilePath && content !== null) {
      const prevOriginal = originalCache.get(activeFilePath);
      const cached = contentCache.get(activeFilePath);
      // If cache exists and matches old original (no user edits), update with fresh content
      // If cache doesn't exist, populate it. If user edited, preserve their edits.
      if (!cached || cached === prevOriginal) {
        contentCache.set(activeFilePath, content);
      }
      originalCache.set(activeFilePath, content);
    }
  }, [activeFilePath, content]);

  // Global Cmd+S / Ctrl+S prevention (safety net for when editor isn't focused)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const path = useFileStore.getState().activeFilePath; // ASSERT: read in event handler
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && path) {
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      const path = useFileStore.getState().activeFilePath; // ASSERT: read from store to avoid stale closure on rapid tab switch
      if (!path) return;
      contentCache.set(path, value);
      const original = originalCache.get(path);
      useFileStore.getState().setDirty(path, value !== original);
    },
    [],
  );

  const handleUpdate = useCallback((update: ViewUpdate) => {
    if (update.selectionSet) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos);
      setCursorPos({ line: line.number, col: pos - line.from + 1 });
    }
  }, []);

  // Build extensions
  const extensions: Extension[] = [
    ...loomDarkTheme,
    search(),
    saveKeymapExtension,
    EditorView.updateListener.of(handleUpdate),
    minimapExtension,
  ];
  if (lineWrap) extensions.push(EditorView.lineWrapping);
  if (langExtension) extensions.push(langExtension);

  // Empty state: no file selected
  if (!activeFilePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Keyboard className="w-8 h-8 opacity-40" />
        <p className="text-sm">Open a file from the tree or Cmd+K</p>
      </div>
    );
  }

  // Binary guard
  if (isBinary) {
    return <BinaryPlaceholder filePath={activeFilePath} />;
  }

  // Large file guard
  if (isLarge && content === null && !loading) {
    return (
      <LargeFileWarning
        filePath={activeFilePath}
        fileSize={activeTab?.fileSize ?? 0}
        onProceed={proceed}
        onCancel={() => setActiveFile(null)}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm text-[var(--status-error)]">Failed to load file</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  const displayContent = contentCache.get(activeFilePath) ?? content ?? '';

  return (
    <div data-codemirror="" className="flex flex-col h-full overflow-hidden">
      <EditorBreadcrumb filePath={activeFilePath} />
      {/* Toolbar strip */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/8 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs"
            onClick={() => setLineWrap((w) => !w)}
            title={lineWrap ? 'Disable word wrap' : 'Enable word wrap'}
          >
            <WrapText className="w-3.5 h-3.5" />
          </Button>
        </div>
        <span className="font-[family-name:var(--font-mono)]">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>
      {/* Editor surface -- font size via CSS custom property on wrapper */}
      <div
        className="flex-1 min-h-0"
        style={{ '--editor-font-size': `${fontSize}px` } as React.CSSProperties}
      >
        <CodeMirror
          value={displayContent}
          height="100%"
          extensions={extensions}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            indentOnInput: true,
          }}
          theme="none"
        />
      </div>
    </div>
  );
}

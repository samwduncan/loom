/**
 * DiffEditor -- CodeMirror merge view wrapper for side-by-side diffs.
 *
 * Renders old (original) and new (modified) content in a read-only
 * merge view with OKLCH theme and diff-colored backgrounds.
 *
 * Not wired into the main CodeEditor yet -- will be activated by the
 * git panel in Phase 26. Exported as both named and default for
 * potential lazy loading.
 *
 * Constitution: Named export (2.2), design tokens (7.14), no inline styles.
 */

import { useState, useEffect } from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { search } from '@codemirror/search';

import { loomDarkTheme } from '@/components/editor/loom-dark-theme';
import { loadLanguageForFile } from '@/components/editor/language-loader';
import { EditorBreadcrumb } from '@/components/editor/EditorBreadcrumb';
import './editor.css';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

export interface DiffEditorProps {
  oldContent: string;
  newContent: string;
  filePath: string;
}

export function DiffEditor({ oldContent, newContent, filePath }: DiffEditorProps) {
  const [langExtension, setLangExtension] = useState<Extension | null>(null);

  // Load language grammar based on file extension
  useEffect(() => {
    const filename = filePath.split('/').pop() ?? '';
    let cancelled = false;
    loadLanguageForFile(filename).then((ext) => {
      if (!cancelled && ext) setLangExtension(ext);
    });
    return () => { cancelled = true; };
  }, [filePath]);

  // Build shared extensions for both sides (read-only diffs)
  const sharedExtensions: Extension[] = [
    ...loomDarkTheme,
    search(),
    EditorView.editable.of(false),
  ];
  if (langExtension) sharedExtensions.push(langExtension);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorBreadcrumb filePath={filePath} />
      {/* Diff badge */}
      <div className="flex items-center px-3 py-1 border-b border-border/8 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-[var(--surface-overlay)] text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
          Diff
        </span>
      </div>
      {/* Merge view surface */}
      <div className="flex-1 min-h-0 diff-editor-wrapper">
        <CodeMirrorMerge
          orientation="a-b"
          theme="none"
        >
          <Original
            value={oldContent}
            extensions={sharedExtensions}
          />
          <Modified
            value={newContent}
            extensions={sharedExtensions}
          />
        </CodeMirrorMerge>
      </div>
    </div>
  );
}
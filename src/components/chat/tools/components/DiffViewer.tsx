import React, { memo, useMemo, useCallback } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ShikiDiffLine } from './ShikiDiffLine';

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  onFileClick?: () => void;
  badge?: string;
  badgeColor?: 'gray' | 'green';
}

/**
 * Map file extension to Shiki language identifier.
 */
const extToLang: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  css: 'css', json: 'json', md: 'markdown', html: 'html',
  py: 'python', rs: 'rust', go: 'go', sh: 'bash',
  yaml: 'yaml', yml: 'yaml', toml: 'toml', sql: 'sql',
  xml: 'xml', svg: 'xml', scss: 'scss', less: 'less',
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return extToLang[ext] || 'text';
}

/**
 * Warm earthy diff theme — overrides ALL dark theme variables to prevent
 * blue-gray bleed-through from the library defaults.
 */
const warmDiffStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1c1210',
      diffViewerColor: '#f5e6d3',
      addedBackground: '#1a2e1a',
      addedColor: '#b8dab8',
      removedBackground: '#2e1a1a',
      removedColor: '#dab8b8',
      changedBackground: '#2a1f1a',
      wordAddedBackground: '#2a4a2a',
      wordRemovedBackground: '#4a2a2a',
      addedGutterBackground: '#152815',
      removedGutterBackground: '#281515',
      gutterBackground: '#241a14',
      gutterBackgroundDark: '#1c1210',
      gutterColor: '#c4a882',
      addedGutterColor: '#b8dab8',
      removedGutterColor: '#dab8b8',
      emptyLineBackground: '#1c1210',
      codeFoldBackground: '#241a14',
      codeFoldGutterBackground: '#1c1210',
      codeFoldContentColor: '#c4a882',
      diffViewerTitleBackground: '#241a14',
      diffViewerTitleColor: '#c4a882',
      diffViewerTitleBorderColor: '#3d2e25',
      highlightBackground: '#3d2e25',
      highlightGutterBackground: '#2a1f1a',
    },
  },
  line: {
    padding: '0 8px',
    fontSize: '12px',
  },
  contentText: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: '12px',
  },
  gutter: {
    minWidth: '40px',
    padding: '0 8px',
  },
  diffContainer: {
    minWidth: 'unset',
  },
};

/**
 * Compact diff viewer — react-diff-viewer-continued with warm earthy theme,
 * word-level diffs, Shiki syntax highlighting, and clickable file paths.
 */
export const DiffViewer: React.FC<DiffViewerProps> = memo(({
  oldContent,
  newContent,
  filePath,
  onFileClick,
  badge = 'Diff',
  badgeColor = 'gray',
}) => {
  const badgeClasses = badgeColor === 'green'
    ? 'bg-green-900/30 text-green-400'
    : 'bg-[#241a14] text-[#c4a882]';

  const language = useMemo(() => detectLanguage(filePath), [filePath]);

  const renderContent = useCallback((str: string) => {
    return <ShikiDiffLine code={str} language={language} />;
  }, [language]);

  // Stable reference for styles object
  const styles = useMemo(() => warmDiffStyles, []);

  return (
    <div className="rounded-lg overflow-hidden border border-[#3d2e25]/40 my-2">
      {/* File path header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#241a14] border-b border-[#3d2e25]/40">
        {onFileClick ? (
          <button
            onClick={onFileClick}
            className="font-mono text-[11px] text-[#6bacce] hover:text-[#a0ccde] truncate transition-colors cursor-pointer"
          >
            {filePath}
          </button>
        ) : (
          <span className="font-mono text-[11px] text-[#c4a882] truncate">
            {filePath}
          </span>
        )}
        {badge && (
          <span className={`text-[10px] font-medium px-1.5 py-px rounded ${badgeClasses} flex-shrink-0 ml-2`}>
            {badge}
          </span>
        )}
      </div>
      <ReactDiffViewer
        oldValue={oldContent}
        newValue={newContent}
        splitView={false}
        useDarkTheme={true}
        showDiffOnly={true}
        extraLinesSurroundingDiff={3}
        compareMethod={DiffMethod.WORDS}
        styles={styles}
        hideLineNumbers={false}
        renderContent={renderContent}
      />
    </div>
  );
});

DiffViewer.displayName = 'DiffViewer';

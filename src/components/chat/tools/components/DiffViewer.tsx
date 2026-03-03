import React, { memo, useMemo, useCallback } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ShikiDiffLine } from './ShikiDiffLine';
import { catppuccinMocha } from '../../../../shared/catppuccin-mocha';

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
 * Charcoal + Catppuccin diff theme — overrides ALL dark theme variables to prevent
 * blue-gray bleed-through from the library defaults.
 */
const charcoalDiffStyles = {
  variables: {
    dark: {
      diffViewerBackground: catppuccinMocha.base,
      diffViewerColor: catppuccinMocha.text,
      addedBackground: 'hsl(140 35% 12%)',
      addedColor: catppuccinMocha.green,
      removedBackground: 'hsl(0 35% 14%)',
      removedColor: catppuccinMocha.red,
      changedBackground: catppuccinMocha.surface0,
      wordAddedBackground: 'hsl(140 35% 20%)',
      wordRemovedBackground: 'hsl(0 35% 22%)',
      addedGutterBackground: 'hsl(140 35% 10%)',
      removedGutterBackground: 'hsl(0 35% 11%)',
      gutterBackground: catppuccinMocha.mantle,
      gutterBackgroundDark: catppuccinMocha.base,
      gutterColor: catppuccinMocha.subtext0,
      addedGutterColor: catppuccinMocha.green,
      removedGutterColor: catppuccinMocha.red,
      emptyLineBackground: catppuccinMocha.base,
      codeFoldBackground: catppuccinMocha.mantle,
      codeFoldGutterBackground: catppuccinMocha.base,
      codeFoldContentColor: catppuccinMocha.subtext0,
      diffViewerTitleBackground: catppuccinMocha.mantle,
      diffViewerTitleColor: catppuccinMocha.subtext0,
      diffViewerTitleBorderColor: catppuccinMocha.surface0,
      highlightBackground: catppuccinMocha.surface0,
      highlightGutterBackground: catppuccinMocha.surface0,
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
    ? 'bg-status-connected/30 text-status-connected'
    : 'bg-surface-raised text-muted-foreground';

  const language = useMemo(() => detectLanguage(filePath), [filePath]);

  const renderContent = useCallback((str: string) => {
    return <ShikiDiffLine code={str} language={language} />;
  }, [language]);

  // Stable reference for styles object
  const styles = useMemo(() => charcoalDiffStyles, []);

  return (
    <div className="rounded-lg overflow-hidden border border-border/10 my-2">
      {/* File path header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-raised border-b border-border/10">
        {onFileClick ? (
          <button
            onClick={onFileClick}
            className="font-mono text-[11px] text-status-info hover:text-status-info truncate transition-colors cursor-pointer"
          >
            {filePath}
          </button>
        ) : (
          <span className="font-mono text-[11px] text-muted-foreground truncate">
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

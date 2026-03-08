/**
 * WriteToolCard -- file write preview card with Shiki syntax highlighting.
 *
 * Nearly identical to ReadToolCard but with threshold=20 and FilePlus icon.
 * Reuses FileContentCard for the rendering logic.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo } from 'react';
import { FilePlus } from 'lucide-react';
import { getLanguageFromPath } from '@/lib/shiki-highlighter';
import { FileContentCard } from './ReadToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

const WRITE_TRUNCATION_THRESHOLD = 20;

export const WriteToolCard = memo(function WriteToolCard({
  input,
  output,
}: ToolCardProps) {
  const filePath =
    typeof input.file_path === 'string' ? input.file_path : 'unknown';
  const language = getLanguageFromPath(filePath);

  return (
    <FileContentCard
      filePath={filePath}
      language={language}
      content={output}
      threshold={WRITE_TRUNCATION_THRESHOLD}
      icon={<FilePlus size={14} className="shrink-0" />}
      expandLabel="Show full file"
    />
  );
});

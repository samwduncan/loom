/**
 * CommitComposer -- commit message textarea + commit button + AI generate button.
 *
 * Handles the commit flow: type message, optionally generate with AI, commit staged files.
 * Toast feedback on success/failure.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGitOperations } from '@/hooks/useGitOperations';

interface CommitComposerProps {
  stagedFiles: Set<string>;
  onCommitSuccess: () => void;
  projectName: string;
}

export function CommitComposer({
  stagedFiles,
  onCommitSuccess,
  projectName,
}: CommitComposerProps) {
  const ops = useGitOperations(projectName);

  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canCommit = stagedFiles.size > 0 && commitMessage.trim() !== '' && !isCommitting;
  const canGenerate = stagedFiles.size > 0 && !isGenerating;

  const handleCommit = useCallback(async () => {
    if (!canCommit) return;
    setIsCommitting(true);
    try {
      await ops.commit(commitMessage.trim(), [...stagedFiles]);
      toast.success('Changes committed');
      setCommitMessage('');
      onCommitSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Commit failed';
      toast.error(message);
    } finally {
      setIsCommitting(false);
    }
  }, [canCommit, ops, commitMessage, stagedFiles, onCommitSuccess]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const message = await ops.generateCommitMessage();
      setCommitMessage(message);
    } catch {
      toast.error('Failed to generate commit message');
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, ops]);

  // Auto-resize: compute rows based on content
  const lineCount = commitMessage.split('\n').length;
  const rows = Math.max(2, Math.min(8, lineCount));

  return (
    <div className="git-commit-composer">
      <div className="git-commit-header">
        <span className="git-commit-label">Commit Message</span>
        <button
          type="button"
          className="git-generate-btn"
          onClick={handleGenerate}
          disabled={!canGenerate}
          aria-label="Generate commit message"
          title="Generate commit message with AI"
        >
          {isGenerating ? (
            <Loader2 size={14} className="git-spinner" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>Generate</span>
        </button>
      </div>

      <textarea
        className="git-commit-textarea"
        placeholder="Commit message..."
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        rows={rows}
      />

      <button
        type="button"
        className="git-commit-btn"
        onClick={handleCommit}
        disabled={!canCommit}
      >
        {isCommitting ? (
          <>
            <Loader2 size={14} className="git-spinner" />
            Committing...
          </>
        ) : (
          <>Commit ({stagedFiles.size} file{stagedFiles.size !== 1 ? 's' : ''})</>
        )}
      </button>
    </div>
  );
}

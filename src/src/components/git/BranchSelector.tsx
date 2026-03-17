/**
 * BranchSelector -- dropdown to switch branches and create new ones.
 *
 * Shows current branch as trigger button, dropdown with branch list,
 * and inline input for creating new branches.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState, useRef, useEffect } from 'react';
import { GitBranch, Check, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGitBranches } from '@/hooks/useGitBranches';
import { useGitOperations } from '@/hooks/useGitOperations';

export interface BranchSelectorProps {
  currentBranch: string;
  projectName: string;
  onBranchChange: () => void;
}

export function BranchSelector({ currentBranch, projectName, onBranchChange }: BranchSelectorProps) {
  const { branches, refetch: refetchBranches } = useGitBranches(projectName);
  const operations = useGitOperations(projectName);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewBranchName('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  async function handleCheckout(branch: string) {
    if (branch === currentBranch) return;
    setOperationLoading(true);
    try {
      await operations.checkout(branch);
      toast.success(`Switched to ${branch}`);
      refetchBranches();
      onBranchChange();
      setIsOpen(false);
    } catch (err) {
      toast.error(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationLoading(false);
    }
  }

  async function handleCreateBranch() {
    const name = newBranchName.trim();
    if (!name) return;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)) {
      toast.error('Invalid branch name. Use letters, numbers, dots, dashes, or slashes.');
      return;
    }
    setOperationLoading(true);
    try {
      await operations.createBranch(name);
      toast.success(`Created branch ${name}`);
      refetchBranches();
      onBranchChange();
      setIsOpen(false);
      setIsCreating(false);
      setNewBranchName('');
    } catch (err) {
      toast.error(`Create branch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationLoading(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleCreateBranch();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewBranchName('');
    }
  }

  return (
    <div className="git-branch-selector" ref={dropdownRef}>
      <button
        type="button"
        className="git-branch-trigger"
        data-testid="branch-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={operationLoading}
        aria-label="Branch selector"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <GitBranch size={14} />
        <span>{currentBranch}</span>
        {operationLoading && <Loader2 size={12} className="git-spinner" />}
      </button>

      {isOpen && (
        <div className="git-branch-dropdown" data-testid="branch-dropdown">
          <div className="git-branch-list">
            {branches?.map((branch) => (
              <button
                key={branch.name}
                type="button"
                className="git-branch-item"
                data-current={branch.current}
                onClick={() => handleCheckout(branch.name)}
                disabled={operationLoading}
              >
                <span className="git-branch-name">{branch.name}</span>
                {branch.current && <Check size={12} />}
              </button>
            ))}
          </div>

          <div className="git-branch-divider" />

          {isCreating ? (
            <div className="git-branch-create-input">
              <input
                ref={inputRef}
                type="text"
                placeholder="Branch name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={operationLoading}
              />
              <button
                type="button"
                className="git-branch-create-confirm"
                onClick={handleCreateBranch}
                disabled={operationLoading || !newBranchName.trim()}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="git-branch-new-btn"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={12} />
              New Branch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Git type definitions -- shared across all git hooks and components.
 *
 * Types match backend API contract (BACKEND_API_CONTRACT.md) with
 * frontend-friendly flattened shapes where needed.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

/** Sub-tab view within the Git panel */
export type GitSubView = 'changes' | 'history';

/** File status categories from git */
export type GitFileStatus = 'modified' | 'added' | 'deleted' | 'untracked';

/** Flattened file change for frontend use (backend sends separate arrays) */
export interface GitFileChange {
  path: string;
  status: GitFileStatus;
}

/** Raw backend response shape from GET /api/git/status */
export interface GitStatusResponse {
  branch: string;
  hasCommits: boolean;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

/** Frontend-friendly flattened git status */
export interface GitStatusData {
  branch: string;
  hasCommits: boolean;
  files: GitFileChange[];
}

/** Single commit entry from GET /api/git/commits */
export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  stats: string;
}

/** Branch entry from GET /api/git/branches */
export interface GitBranch {
  name: string;
  current: boolean;
}

/** Remote status from GET /api/git/remote-status */
export interface GitRemoteStatus {
  hasRemote: boolean;
  hasUpstream: boolean;
  branch: string;
  remoteBranch?: string;
  remoteName?: string;
  ahead?: number;
  behind?: number;
  isUpToDate?: boolean;
  message?: string;
}

/** Fetch state const object pattern (same as useFileDiff) */
export const FetchState = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Errored: 'errored',
} as const;

export type FetchState = (typeof FetchState)[keyof typeof FetchState];

import { useEffect, useRef, useState } from 'react';

/**
 * Extracts a semantic activity description from a tool name and its input.
 * Handles missing/undefined toolInput gracefully.
 */
export function parseActivityText(
  toolName: string | undefined | null,
  toolInput: Record<string, unknown> | string | undefined | null,
): string {
  if (!toolName) return 'Processing...';

  // Safely extract fields from toolInput
  const input: Record<string, unknown> =
    typeof toolInput === 'object' && toolInput !== null
      ? toolInput
      : {};

  const basename = (filePath: unknown): string => {
    if (typeof filePath !== 'string' || !filePath) return 'file';
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'file';
  };

  const truncate = (text: unknown, maxLength: number): string => {
    if (typeof text !== 'string') return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  switch (toolName) {
    case 'Read':
      return `Reading ${basename(input.file_path)}...`;
    case 'Write':
      return `Writing ${basename(input.file_path)}...`;
    case 'Edit':
      return `Editing ${basename(input.file_path)}...`;
    case 'Bash':
      return 'Running command...';
    case 'Grep':
      return input.pattern
        ? `Searching for "${truncate(input.pattern, 20)}"...`
        : 'Searching...';
    case 'Glob':
      return 'Finding files...';
    case 'Task':
      return 'Running subtask...';
    default:
      return `Using ${toolName}...`;
  }
}

interface ClaudeStatusLike {
  text?: string;
  tokens?: number;
  can_interrupt?: boolean;
}

interface ActivityStatus {
  activityText: string;
  elapsedSeconds: number;
  tokenCount: number;
}

/**
 * Hook that derives semantic activity text from claude status / tool events,
 * tracks elapsed time during loading, and exposes token count.
 */
export function useActivityStatus(
  claudeStatus: ClaudeStatusLike | null,
  isLoading: boolean,
): ActivityStatus {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer: starts when isLoading becomes true, resets when false
  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoading]);

  // Derive activity text from claudeStatus
  const activityText = claudeStatus?.text || 'Processing...';
  const tokenCount = claudeStatus?.tokens ?? 0;

  return { activityText, elapsedSeconds, tokenCount };
}

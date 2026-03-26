/**
 * session-project-map -- maps sessionId → projectName for cross-project routing.
 *
 * Populated by useMultiProjectSessions when sessions load.
 * Consumed by ChatView to pass the correct projectName to API calls.
 */

const sessionProjectMap = new Map<string, string>();

export function setSessionProject(sessionId: string, projectName: string): void {
  sessionProjectMap.set(sessionId, projectName);
}

export function getSessionProject(sessionId: string): string | null {
  return sessionProjectMap.get(sessionId) ?? null;
}

export function setSessionProjectBatch(entries: Array<{ sessionId: string; projectName: string }>): void {
  for (const { sessionId, projectName } of entries) {
    sessionProjectMap.set(sessionId, projectName);
  }
}

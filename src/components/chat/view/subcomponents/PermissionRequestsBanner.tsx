import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { PendingPermissionRequest } from '../../types/types';
import { buildClaudeToolPermissionEntry, formatToolInputForDisplay } from '../../utils/chatPermissions';
import { getClaudeSettings } from '../../utils/chatStorage';
import { getPermissionPanel, registerPermissionPanel } from '../../tools/configs/permissionPanelRegistry';
import { AskUserQuestionPanel } from '../../tools/components/InteractiveRenderers';

registerPermissionPanel('AskUserQuestion', AskUserQuestionPanel);

interface PermissionRequestsBannerProps {
  pendingPermissionRequests: PendingPermissionRequest[];
  handlePermissionDecision: (
    requestIds: string | string[],
    decision: { allow?: boolean; message?: string; rememberEntry?: string | null; updatedInput?: unknown },
  ) => void;
  handleGrantToolPermission: (suggestion: { entry: string; toolName: string }) => { success: boolean };
}

export default function PermissionRequestsBanner({
  pendingPermissionRequests,
  handlePermissionDecision,
  handleGrantToolPermission,
}: PermissionRequestsBannerProps) {
  const [resolvedPermissions, setResolvedPermissions] = useState<Map<string, 'approved' | 'denied'>>(new Map());

  if (!pendingPermissionRequests.length) {
    return null;
  }

  const handleAllow = (requestId: string) => {
    setResolvedPermissions(prev => new Map(prev).set(requestId, 'approved'));
    handlePermissionDecision(requestId, { allow: true });
    setTimeout(() => {
      setResolvedPermissions(prev => {
        const next = new Map(prev);
        next.delete(requestId);
        return next;
      });
    }, 2000);
  };

  const handleAllowAndRemember = (requestIds: string | string[], permissionEntry: string | null, alreadyAllowed: boolean, toolName: string) => {
    const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
    ids.forEach(id => {
      setResolvedPermissions(prev => new Map(prev).set(id, 'approved'));
    });
    if (permissionEntry && !alreadyAllowed) {
      handleGrantToolPermission({ entry: permissionEntry, toolName });
    }
    handlePermissionDecision(requestIds, { allow: true, rememberEntry: permissionEntry });
    setTimeout(() => {
      setResolvedPermissions(prev => {
        const next = new Map(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    }, 2000);
  };

  const handleDeny = (requestId: string) => {
    setResolvedPermissions(prev => new Map(prev).set(requestId, 'denied'));
    handlePermissionDecision(requestId, { allow: false, message: 'User denied tool use' });
    setTimeout(() => {
      setResolvedPermissions(prev => {
        const next = new Map(prev);
        next.delete(requestId);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="mb-3 space-y-2">
      {pendingPermissionRequests.map((request) => {
        const CustomPanel = getPermissionPanel(request.toolName);
        if (CustomPanel) {
          return (
            <CustomPanel
              key={request.requestId}
              request={request}
              onDecision={handlePermissionDecision}
            />
          );
        }

        const rawInput = formatToolInputForDisplay(request.input);
        const permissionEntry = buildClaudeToolPermissionEntry(request.toolName, rawInput);
        const settings = getClaudeSettings();
        const alreadyAllowed = permissionEntry ? settings.allowedTools.includes(permissionEntry) : false;
        const rememberLabel = alreadyAllowed ? 'Allow (saved)' : 'Allow & remember';
        const matchingRequestIds = permissionEntry
          ? pendingPermissionRequests
              .filter(
                (item) =>
                  buildClaudeToolPermissionEntry(item.toolName, formatToolInputForDisplay(item.input)) === permissionEntry,
              )
              .map((item) => item.requestId)
          : [request.requestId];

        const resolved = resolvedPermissions.get(request.requestId);

        return (
          <div
            key={request.requestId}
            className="rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 shadow-sm border-l-3 border-l-amber-500"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-amber-100">Permission required</div>
                <div className="text-xs text-amber-200">
                  Tool: <span className="font-mono font-bold">{request.toolName}</span>
                </div>
              </div>
              {permissionEntry && (
                <div className="text-xs text-amber-300">
                  Allow rule: <span className="font-mono">{permissionEntry}</span>
                </div>
              )}
            </div>

            {rawInput && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-200 hover:text-amber-100">
                  View tool input
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-surface-base/60 border border-amber-800/60 p-2 text-xs text-amber-100 whitespace-pre-wrap">
                  {rawInput}
                </pre>
              </details>
            )}

            {/* Status indicator */}
            {resolved === 'approved' ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approved</span>
              </div>
            ) : resolved === 'denied' ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Denied</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-amber-300/60 animate-pulse">
                Waiting for response...
              </div>
            )}

            {/* Action buttons - hidden when resolved */}
            {!resolvedPermissions.has(request.requestId) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAllow(request.requestId)}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-amber-700 transition-colors"
                >
                  Allow once
                </button>
                <button
                  type="button"
                  onClick={() => handleAllowAndRemember(matchingRequestIds, permissionEntry, alreadyAllowed, request.toolName)}
                  className={`inline-flex items-center gap-2 rounded-md text-xs font-medium px-3 py-1.5 border transition-colors ${
                    permissionEntry
                      ? 'border-amber-700 text-amber-100 hover:bg-amber-900/30'
                      : 'border-border/20 text-muted-foreground cursor-not-allowed'
                  }`}
                  disabled={!permissionEntry}
                >
                  {rememberLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeny(request.requestId)}
                  className="inline-flex items-center gap-2 rounded-md text-xs font-medium px-3 py-1.5 border border-red-800 text-red-200 hover:bg-red-900/30 transition-colors"
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

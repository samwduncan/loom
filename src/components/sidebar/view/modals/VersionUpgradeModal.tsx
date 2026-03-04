import { useCallback, useState } from "react";
import { authenticatedFetch } from "../../../../utils/api";
import { ReleaseInfo } from "../../../../types/sharedTypes";
import { copyTextToClipboard } from "../../../../utils/clipboard";
import { OverlayPortal } from "../../../ui/overlay-portal";
import type { InstallMode } from "../../../../hooks/useVersionCheck";

interface VersionUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    releaseInfo: ReleaseInfo | null;
    currentVersion: string;
    latestVersion: string | null;
    installMode: InstallMode;
}

export default function VersionUpgradeModal({
    isOpen,
    onClose,
    releaseInfo,
    currentVersion,
    latestVersion,
    installMode
}: VersionUpgradeModalProps) {
    const upgradeCommand = installMode === 'npm'
        ? 'npm install -g @siteboon/claude-code-ui@latest'
        : 'git checkout main && git pull && npm install';
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateOutput, setUpdateOutput] = useState('');
    const [updateError, setUpdateError] = useState('');

    const handleUpdateNow = useCallback(async () => {
        setIsUpdating(true);
        setUpdateOutput('Starting update...\n');
        setUpdateError('');

        try {
            // Call the backend API to run the update command
            const response = await authenticatedFetch('/api/system/update', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setUpdateOutput(prev => prev + data.output + '\n');
                setUpdateOutput(prev => prev + '\n✅ Update completed successfully!\n');
                setUpdateOutput(prev => prev + 'Please restart the server to apply changes.\n');
            } else {
                setUpdateError(data.error || 'Update failed');
                setUpdateOutput(prev => prev + '\n❌ Update failed: ' + (data.error || 'Unknown error') + '\n');
            }
        } catch (error: any) {
            setUpdateError(error.message);
            setUpdateOutput(prev => prev + '\n❌ Update failed: ' + error.message + '\n');
        } finally {
            setIsUpdating(false);
        }
    }, []);

    if (!isOpen) return null;

    return (
        <OverlayPortal>
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
            {/* Backdrop */}
            <button
                className="fixed inset-0 bg-background/60 backdrop-blur-xl"
                onClick={onClose}
                aria-label={"Close version upgrade modal"}
            />

            {/* Modal */}
            <div className="relative bg-surface-raised rounded-lg shadow-xl border border-border/10 w-full max-w-2xl mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-status-info/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">{"Update Available"}</h2>
                            <p className="text-sm text-muted-foreground">
                                {releaseInfo?.title || "A new version is ready"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Version Info */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-surface-elevated rounded-lg">
                        <span className="text-sm font-medium text-foreground-secondary">{"Current Version"}</span>
                        <span className="text-sm text-foreground font-mono">{currentVersion}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-status-info/10 rounded-lg border border-status-info/30">
                        <span className="text-sm font-medium text-status-info">{"Latest Version"}</span>
                        <span className="text-sm text-foreground font-mono">{latestVersion}</span>
                    </div>
                </div>

                {/* Changelog */}
                {releaseInfo?.body && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground">{"What's New:"}</h3>
                            {releaseInfo?.htmlUrl && (
                                <a
                                    href={releaseInfo.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-status-info hover:text-status-info/80 hover:underline flex items-center gap-1"
                                >
                                    {"View full release"}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="bg-surface-elevated rounded-lg p-4 border border-border/10 max-h-64 overflow-y-auto">
                            <div className="text-sm text-foreground-secondary whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
                                {cleanChangelog(releaseInfo.body)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Update Output */}
                {(updateOutput || updateError) && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-foreground">{"Update Progress:"}</h3>
                        <div className="bg-surface-base rounded-lg p-4 border border-border/10 max-h-48 overflow-y-auto">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{updateOutput}</pre>
                        </div>
                        {updateError && (
                            <div className="rounded-md border border-status-error/40 bg-status-error/20 px-3 py-2 text-xs text-status-error">
                                {updateError}
                            </div>
                        )}
                    </div>
                )}

                {/* Upgrade Instructions */}
                {!isUpdating && !updateOutput && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">{"Manual upgrade:"}</h3>
                        <div className="bg-surface-raised rounded-lg p-3 border border-border/10">
                            <code className="text-sm text-foreground-secondary font-mono">
                                {upgradeCommand}
                            </code>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {"Or click \"Update Now\" to run the update automatically."}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-raised hover:bg-surface-elevated rounded-md transition-colors"
                    >
                        {updateOutput ? "Close" : "Later"}
                    </button>
                    {!updateOutput && (
                        <>
                            <button
                                onClick={() => copyTextToClipboard(upgradeCommand)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-raised hover:bg-surface-elevated rounded-md transition-colors"
                            >
                                {"Copy Command"}
                            </button>
                            <button
                                onClick={handleUpdateNow}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {"Updating..."}
                                    </>
                                ) : (
                                    "Update Now"
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
        </OverlayPortal>
    );
};

// Clean up changelog by removing GitHub-specific metadata
const cleanChangelog = (body: string) => {
    if (!body) return '';

    return body
        // Remove full commit hashes (40 character hex strings)
        .replace(/\b[0-9a-f]{40}\b/gi, '')
        // Remove short commit hashes (7-10 character hex strings at start of line or after dash/space)
        .replace(/(?:^|\s|-)([0-9a-f]{7,10})\b/gi, '')
        // Remove "Full Changelog" links
        .replace(/\*\*Full Changelog\*\*:.*$/gim, '')
        // Remove compare links (e.g., https://github.com/.../compare/v1.0.0...v1.0.1)
        .replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/[^\s)]+/gi, '')
        // Clean up multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Trim whitespace
        .trim();
};

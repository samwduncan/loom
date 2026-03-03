import { useMemo } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { OverlayPortal } from '../../../ui/overlay-portal';
import ProjectCreationWizard from '../../../ProjectCreationWizard';
import Settings from '../../../settings/view/Settings';
import VersionUpgradeModal from '../modals/VersionUpgradeModal';
import type { Project } from '../../../../types/app';
import type { ReleaseInfo } from '../../../../types/sharedTypes';
import type { InstallMode } from '../../../../hooks/useVersionCheck';
import { normalizeProjectForSettings } from '../../utils/utils';
import type { DeleteProjectConfirmation, SessionDeleteConfirmation, SettingsProject } from '../../types/types';

type SidebarModalsProps = {
  projects: Project[];
  showSettings: boolean;
  settingsInitialTab: string;
  onCloseSettings: () => void;
  showNewProject: boolean;
  onCloseNewProject: () => void;
  onProjectCreated: () => void;
  deleteConfirmation: DeleteProjectConfirmation | null;
  onCancelDeleteProject: () => void;
  onConfirmDeleteProject: () => void;
  sessionDeleteConfirmation: SessionDeleteConfirmation | null;
  onCancelDeleteSession: () => void;
  onConfirmDeleteSession: () => void;
  showVersionModal: boolean;
  onCloseVersionModal: () => void;
  releaseInfo: ReleaseInfo | null;
  currentVersion: string;
  latestVersion: string | null;
  installMode: InstallMode;
};

type TypedSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  projects: SettingsProject[];
  initialTab: string;
};

const SettingsComponent = Settings as (props: TypedSettingsProps) => JSX.Element;

function TypedSettings(props: TypedSettingsProps) {
  return <SettingsComponent {...props} />;
}

export default function SidebarModals({
  projects,
  showSettings,
  settingsInitialTab,
  onCloseSettings,
  showNewProject,
  onCloseNewProject,
  onProjectCreated,
  deleteConfirmation,
  onCancelDeleteProject,
  onConfirmDeleteProject,
  sessionDeleteConfirmation,
  onCancelDeleteSession,
  onConfirmDeleteSession,
  showVersionModal,
  onCloseVersionModal,
  releaseInfo,
  currentVersion,
  latestVersion,
  installMode,
}: SidebarModalsProps) {
  // Settings expects project identity/path fields to be present for dropdown labels and local-scope MCP config.
  const settingsProjects = useMemo(
    () => projects.map(normalizeProjectForSettings),
    [projects],
  );

  return (
    <>
      {showNewProject && (
        <OverlayPortal>
          <ProjectCreationWizard
            onClose={onCloseNewProject}
            onProjectCreated={onProjectCreated}
          />
        </OverlayPortal>
      )}

      {showSettings && (
        <OverlayPortal>
          <TypedSettings
            isOpen={showSettings}
            onClose={onCloseSettings}
            projects={settingsProjects}
            initialTab={settingsInitialTab}
          />
        </OverlayPortal>
      )}

      {deleteConfirmation && (
        <OverlayPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal)] p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {"Delete Project"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {"Are you sure you want to delete"}{' '}
                      <span className="font-medium text-foreground">
                        {deleteConfirmation.project.displayName || deleteConfirmation.project.name}
                      </span>
                      ?
                    </p>
                    {deleteConfirmation.sessionCount > 0 && (
                      <div className="mt-3 p-3 bg-red-50 bg-red-900/20 border border-red-200 border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 text-red-300 font-medium">
                          {`This project contains ${deleteConfirmation.sessionCount} conversation${deleteConfirmation.sessionCount === 1 ? '' : 's'}.`}
                        </p>
                        <p className="text-xs text-red-600 text-red-400 mt-1">
                          {"All conversations will be permanently deleted."}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      {"This action cannot be undone."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-muted/30 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={onCancelDeleteProject}>
                  {"Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={onConfirmDeleteProject}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {"Delete"}
                </Button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      {sessionDeleteConfirmation && (
        <OverlayPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal)] p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {"Delete Session"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {"Are you sure you want to delete"}{' '}
                      <span className="font-medium text-foreground">
                        {sessionDeleteConfirmation.sessionTitle || "Unnamed"}
                      </span>
                      ?
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {"This action cannot be undone."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-muted/30 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={onCancelDeleteSession}>
                  {"Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={onConfirmDeleteSession}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {"Delete"}
                </Button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      <VersionUpgradeModal
        isOpen={showVersionModal}
        onClose={onCloseVersionModal}
        releaseInfo={releaseInfo}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        installMode={installMode}
      />
    </>
  );
}

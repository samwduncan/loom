import { Check, Edit2, Trash2, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatTimeAgo } from '../../../../utils/dateUtils';
import type { Project, ProjectSession, SessionProvider } from '../../../../types/app';
import type { SessionWithProvider, TouchHandlerFactory } from '../../types/types';
import { createSessionViewModel } from '../../utils/utils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

type SidebarSessionItemProps = {
  project: Project;
  session: SessionWithProvider;
  selectedSession: ProjectSession | null;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  onEditingSessionNameChange: (value: string) => void;
  onStartEditingSession: (sessionId: string, initialName: string) => void;
  onCancelEditingSession: () => void;
  onSaveEditingSession: (projectName: string, sessionId: string, summary: string) => void;
  onProjectSelect: (project: Project) => void;
  onSessionSelect: (session: SessionWithProvider, projectName: string) => void;
  onDeleteSession: (
    projectName: string,
    sessionId: string,
    sessionTitle: string,
    provider: SessionProvider,
  ) => void;
  touchHandlerFactory: TouchHandlerFactory;
};

export default function SidebarSessionItem({
  project,
  session,
  selectedSession,
  currentTime,
  editingSession,
  editingSessionName,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  onProjectSelect,
  onSessionSelect,
  onDeleteSession,
  touchHandlerFactory,
}: SidebarSessionItemProps) {
  const sessionView = createSessionViewModel(session, currentTime);
  const isSelected = selectedSession?.id === session.id;

  const selectMobileSession = () => {
    onProjectSelect(project);
    onSessionSelect(session, project.name);
  };

  const saveEditedSession = () => {
    onSaveEditingSession(project.name, session.id, editingSessionName);
  };

  const requestDeleteSession = () => {
    onDeleteSession(project.name, session.id, sessionView.sessionName, session.__provider);
  };

  return (
    <div className="group relative">
      {/* Mobile variant — card style with rose indicators */}
      <div className="md:hidden">
        <div
          className={cn(
            'p-2 mx-3 my-0.5 rounded-md bg-card border active:scale-[0.98] transition-all duration-150 relative',
            isSelected
              ? 'border-l-2 border-primary bg-accent/10 border-t-border/30 border-r-border/30 border-b-border/30'
              : 'border-border/30',
            !isSelected && sessionView.isActive
              ? 'border-l-2 border-l-primary/50 bg-accent/5'
              : '',
          )}
          onClick={selectMobileSession}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-primary/10' : 'bg-muted/50',
              )}
            >
              <SessionProviderLogo provider={session.__provider} className="w-3 h-3" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-foreground">{sessionView.sessionName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-muted-foreground">
                  {formatTimeAgo(sessionView.sessionTime, currentTime)}
                </span>
                <span className="ml-auto opacity-70">
                  <SessionProviderLogo provider={session.__provider} className="w-3 h-3" />
                </span>
              </div>
            </div>

            <button
              className="w-5 h-5 rounded-md bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform opacity-70 ml-1"
              onClick={(event) => {
                event.stopPropagation();
                requestDeleteSession();
              }}
            >
              <Trash2 className="w-2.5 h-2.5 text-destructive" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop variant — compact single-line with rose left border */}
      <div className="hidden md:block">
        <div
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors duration-150',
            isSelected && 'border-l-2 border-primary bg-accent/10',
            !isSelected && 'border-l-2 border-transparent',
          )}
          onClick={() => onSessionSelect(session, project.name)}
        >
          <SessionProviderLogo provider={session.__provider} className="w-3 h-3 flex-shrink-0" />
          <span className="text-xs font-medium truncate flex-1 text-foreground">{sessionView.sessionName}</span>
          <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 tabular-nums group-hover:opacity-0 transition-opacity">
            {formatTimeAgo(sessionView.sessionTime, currentTime)}
          </span>
        </div>

        {/* Hover action buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {editingSession === session.id && !sessionView.isCodexSession ? (
              <>
                <input
                  type="text"
                  value={editingSessionName}
                  onChange={(event) => onEditingSessionNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') {
                      saveEditedSession();
                    } else if (event.key === 'Escape') {
                      onCancelEditingSession();
                    }
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-32 px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  className="w-6 h-6 bg-emerald-900/20 hover:bg-emerald-900/40 rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    saveEditedSession();
                  }}
                  title={"Save"}
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                </button>
                <button
                  className="w-6 h-6 bg-surface-raised hover:bg-surface-elevated rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelEditingSession();
                  }}
                  title={"Cancel"}
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                {!sessionView.isCodexSession && (
                  <button
                    className="w-6 h-6 bg-surface-raised hover:bg-surface-elevated rounded flex items-center justify-center"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartEditingSession(session.id, session.summary || 'New Session');
                    }}
                    title={"Manually edit session name"}
                  >
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  className="w-6 h-6 bg-destructive/10 hover:bg-destructive/20 rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestDeleteSession();
                  }}
                  title={"Delete this session permanently"}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </>
            )}
          </div>
      </div>
    </div>
  );
}

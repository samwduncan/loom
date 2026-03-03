import SessionProviderLogo from '../../../../llm-logo-provider/SessionProviderLogo';
import type { AgentProvider, AuthStatus } from '../../../types/types';

type AgentListItemProps = {
  agentId: AgentProvider;
  authStatus: AuthStatus;
  isSelected: boolean;
  onClick: () => void;
  isMobile?: boolean;
};

type AgentConfig = {
  name: string;
  color: 'blue' | 'purple' | 'muted' | 'indigo';
};

const agentConfig: Record<AgentProvider, AgentConfig> = {
  claude: {
    name: 'Claude',
    color: 'blue',
  },
  codex: {
    name: 'Codex',
    color: 'muted',
  },
  gemini: {
    name: 'Gemini',
    color: 'indigo',
  }
};

const colorClasses = {
  blue: {
    border: 'border-l-blue-500 md:border-l-blue-500',
    borderBottom: 'border-b-blue-500',
    bg: 'bg-blue-50 bg-blue-900/20',
    dot: 'bg-blue-500',
  },
  purple: {
    border: 'border-l-purple-500 md:border-l-purple-500',
    borderBottom: 'border-b-purple-500',
    bg: 'bg-purple-50 bg-purple-900/20',
    dot: 'bg-purple-500',
  },
  muted: {
    border: 'border-l-border/20',
    borderBottom: 'border-b-border/20',
    bg: 'bg-surface-raised',
    dot: 'bg-muted-foreground',
  },
  indigo: {
    border: 'border-l-indigo-500 md:border-l-indigo-500',
    borderBottom: 'border-b-indigo-500',
    bg: 'bg-indigo-50 bg-indigo-900/20',
    dot: 'bg-indigo-500',
  },
} as const;

export default function AgentListItem({
  agentId,
  authStatus,
  isSelected,
  onClick,
  isMobile = false,
}: AgentListItemProps) {
  const config = agentConfig[agentId];
  const colors = colorClasses[config.color];

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`flex-1 text-center py-3 px-2 border-b-2 transition-colors ${isSelected
          ? `${colors.borderBottom} ${colors.bg}`
          : 'border-transparent hover:bg-surface-raised'
          }`}
      >
        <div className="flex flex-col items-center gap-1">
          <SessionProviderLogo provider={agentId} className="w-5 h-5" />
          <span className="text-xs font-medium text-foreground">{config.name}</span>
          {authStatus.authenticated && (
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-l-4 transition-colors ${isSelected
        ? `${colors.border} ${colors.bg}`
        : 'border-transparent hover:bg-surface-raised'
        }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <SessionProviderLogo provider={agentId} className="w-4 h-4" />
        <span className="font-medium text-foreground">{config.name}</span>
      </div>
      <div className="text-xs text-muted-foreground pl-6">
        {authStatus.loading ? (
          <span className="text-muted-foreground">{"Checking..."}</span>
        ) : authStatus.authenticated ? (
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            <span className="truncate max-w-[120px]" title={authStatus.email ?? undefined}>
              {authStatus.email || "Connected"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span>{"Not connected"}</span>
          </div>
        )}
      </div>
    </button>
  );
}

import { LogIn } from 'lucide-react';
import { Badge } from '../../../../../../ui/badge';
import { Button } from '../../../../../../ui/button';
import SessionProviderLogo from '../../../../../../llm-logo-provider/SessionProviderLogo';
import type { AgentProvider, AuthStatus } from '../../../../../types/types';

type AccountContentProps = {
  agent: AgentProvider;
  authStatus: AuthStatus;
  onLogin: () => void;
};

type AgentVisualConfig = {
  name: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  subtextClass: string;
  buttonClass: string;
  description: string;
};

const agentConfig: Record<AgentProvider, AgentVisualConfig> = {
  claude: {
    name: 'Claude',
    bgClass: 'bg-blue-50 bg-blue-900/20',
    borderClass: 'border-blue-200 border-blue-800',
    textClass: 'text-blue-900 text-blue-100',
    subtextClass: 'text-blue-700 text-blue-300',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    description: 'Anthropic Claude AI assistant',
  },
  codex: {
    name: 'Codex',
    bgClass: 'bg-gray-100 bg-gray-800/50',
    borderClass: 'border-gray-300 border-gray-600',
    textClass: 'text-gray-900 text-gray-100',
    subtextClass: 'text-gray-700 text-gray-300',
    buttonClass: 'bg-gray-800 hover:bg-gray-900 bg-gray-700 hover:bg-gray-600',
    description: 'OpenAI Codex AI assistant',
  },
  gemini: {
    name: 'Gemini',
    bgClass: 'bg-indigo-50 bg-indigo-900/20',
    borderClass: 'border-indigo-200 border-indigo-800',
    textClass: 'text-indigo-900 text-indigo-100',
    subtextClass: 'text-indigo-700 text-indigo-300',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700',
    description: 'Google Gemini AI assistant',
  },
};

export default function AccountContent({ agent, authStatus, onLogin }: AccountContentProps) {
  const config = agentConfig[agent];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <SessionProviderLogo provider={agent} className="w-6 h-6" />
        <div>
          <h3 className="text-lg font-medium text-foreground">{config.name}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <div className={`${config.bgClass} border ${config.borderClass} rounded-lg p-4`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className={`font-medium ${config.textClass}`}>
                {"Connection Status"}
              </div>
              <div className={`text-sm ${config.subtextClass}`}>
                {authStatus.loading ? (
                  "Checking authentication status..."
                ) : authStatus.authenticated ? (
                  `Logged in as ${authStatus.email || "authenticated user"}`
                ) : (
                  "Not connected"
                )}
              </div>
            </div>
            <div>
              {authStatus.loading ? (
                <Badge variant="secondary" className="bg-gray-100 bg-gray-800">
                  {"Checking..."}
                </Badge>
              ) : authStatus.authenticated ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 bg-green-900/30 text-green-300">
                  {"Connected"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 bg-gray-800 text-gray-300">
                  {"Disconnected"}
                </Badge>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${config.textClass}`}>
                  {authStatus.authenticated ? "Re-authenticate" : "Login"}
                </div>
                <div className={`text-sm ${config.subtextClass}`}>
                  {authStatus.authenticated
                    ? "Sign in with a different account or refresh credentials"
                    : `Sign in to your ${config.name} account to enable AI features`}
                </div>
              </div>
              <Button
                onClick={onLogin}
                className={`${config.buttonClass} text-white`}
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {authStatus.authenticated ? "Re-login" : "Login"}
              </Button>
            </div>
          </div>

          {authStatus.error && (
            <div className="border-t border-gray-200 border-gray-700 pt-4">
              <div className="text-sm text-red-600 text-red-400">
                {`Error: ${authStatus.error}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

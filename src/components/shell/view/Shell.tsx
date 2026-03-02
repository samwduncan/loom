import { useCallback, useMemo, useState } from 'react';
import '@xterm/xterm/css/xterm.css';
import type { Project, ProjectSession } from '../../../types/app';
import { SHELL_RESTART_DELAY_MS } from '../constants/constants';
import { useShellRuntime } from '../hooks/useShellRuntime';
import { getSessionDisplayName } from '../utils/auth';
import ShellConnectionOverlay from './subcomponents/ShellConnectionOverlay';
import ShellEmptyState from './subcomponents/ShellEmptyState';
import ShellHeader from './subcomponents/ShellHeader';
import ShellMinimalView from './subcomponents/ShellMinimalView';

type ShellProps = {
  selectedProject?: Project | null;
  selectedSession?: ProjectSession | null;
  initialCommand?: string | null;
  isPlainShell?: boolean;
  onProcessComplete?: ((exitCode: number) => void) | null;
  minimal?: boolean;
  autoConnect?: boolean;
  isActive?: boolean;
};

export default function Shell({
  selectedProject = null,
  selectedSession = null,
  initialCommand = null,
  isPlainShell = false,
  onProcessComplete = null,
  minimal = false,
  autoConnect = false,
  isActive,
}: ShellProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  // Keep the public API stable for existing callers that still pass `isActive`.
  void isActive;

  const {
    terminalContainerRef,
    isConnected,
    isInitialized,
    isConnecting,
    authUrl,
    authUrlVersion,
    connectToShell,
    disconnectFromShell,
    openAuthUrlInBrowser,
    copyAuthUrlToClipboard,
  } = useShellRuntime({
    selectedProject,
    selectedSession,
    initialCommand,
    isPlainShell,
    minimal,
    autoConnect,
    isRestarting,
    onProcessComplete,
  });

  const sessionDisplayName = useMemo(() => getSessionDisplayName(selectedSession), [selectedSession]);
  const sessionDisplayNameShort = useMemo(
    () => (sessionDisplayName ? sessionDisplayName.slice(0, 30) : null),
    [sessionDisplayName],
  );
  const sessionDisplayNameLong = useMemo(
    () => (sessionDisplayName ? sessionDisplayName.slice(0, 50) : null),
    [sessionDisplayName],
  );

  const handleRestartShell = useCallback(() => {
    setIsRestarting(true);
    window.setTimeout(() => {
      setIsRestarting(false);
    }, SHELL_RESTART_DELAY_MS);
  }, []);

  if (!selectedProject) {
    return (
      <ShellEmptyState
        title="Select a Project"
        description="Choose a project to open an interactive shell in that directory"
      />
    );
  }

  if (minimal) {
    return (
      <ShellMinimalView
        terminalContainerRef={terminalContainerRef}
        authUrl={authUrl}
        authUrlVersion={authUrlVersion}
        initialCommand={initialCommand}
        isConnected={isConnected}
        openAuthUrlInBrowser={openAuthUrlInBrowser}
        copyAuthUrlToClipboard={copyAuthUrlToClipboard}
      />
    );
  }

  const readyDescription = isPlainShell
    ? `Run ${initialCommand || 'command'} in ${selectedProject.displayName}`
    : selectedSession
      ? `Resume session: ${sessionDisplayNameLong}...`
      : 'Start a new Claude session';

  const connectingDescription = isPlainShell
    ? `Run ${initialCommand || 'command'} in ${selectedProject.displayName}`
    : `Starting Claude CLI in ${selectedProject.displayName}`;

  const overlayMode = !isInitialized ? 'loading' : isConnecting ? 'connecting' : !isConnected ? 'connect' : null;
  const overlayDescription = overlayMode === 'connecting' ? connectingDescription : readyDescription;

  return (
    <div className="h-full flex flex-col bg-gray-900 w-full">
      <ShellHeader
        isConnected={isConnected}
        isInitialized={isInitialized}
        isRestarting={isRestarting}
        hasSession={Boolean(selectedSession)}
        sessionDisplayNameShort={sessionDisplayNameShort}
        onDisconnect={disconnectFromShell}
        onRestart={handleRestartShell}
        statusNewSessionText="New Session"
        statusInitializingText="Initializing..."
        statusRestartingText="Restarting..."
        disconnectLabel="Disconnect"
        disconnectTitle="Disconnect from shell"
        restartLabel="Restart"
        restartTitle="Restart Shell (disconnect first)"
        disableRestart={isRestarting || isConnected}
      />

      <div className="flex-1 p-2 overflow-hidden relative">
        <div
          ref={terminalContainerRef}
          className="h-full w-full focus:outline-none"
          style={{ outline: 'none' }}
        />

        {overlayMode && (
          <ShellConnectionOverlay
            mode={overlayMode}
            description={overlayDescription}
            loadingLabel="Loading terminal..."
            connectLabel="Continue in Shell"
            connectTitle="Connect to shell"
            connectingLabel="Connecting to shell..."
            onConnect={connectToShell}
          />
        )}
      </div>
    </div>
  );
}

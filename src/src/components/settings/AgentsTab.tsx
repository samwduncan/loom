/**
 * AgentsTab -- Provider status display with colored dots and model info.
 *
 * Shows connection status for Claude, Codex, and Gemini providers.
 * Each row displays: provider name, status dot, email, default model, error message.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { Bot } from 'lucide-react';
import { useAgentStatuses } from '@/hooks/useSettingsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsTabSkeleton } from './SettingsTabSkeleton';
import { cn } from '@/utils/cn';
import type { ProviderStatus } from '@/types/settings';

function StatusDot({ status }: { status: ProviderStatus }) {
  const color = status.error
    ? 'bg-[var(--color-warning)]'
    : status.authenticated
      ? 'bg-[var(--color-success)]'
      : 'bg-[var(--color-destructive)]';

  return <span className={cn('inline-block size-2.5 rounded-full shrink-0', color)} data-testid={`status-dot-${status.provider}`} />;
}

function statusLabel(status: ProviderStatus): string {
  if (status.error) return 'Error';
  return status.authenticated ? 'Connected' : 'Disconnected';
}

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
};

export function AgentsTab() {
  const { data: statuses, isLoading, error, refetch } = useAgentStatuses();

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-2 p-1" data-testid="agents-tab-error">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1" data-testid="agents-tab">
      <h3 className="text-foreground text-base font-medium">AI Providers</h3>

      <div className="space-y-3">
        {statuses.map((status) => (
          <Card key={status.provider} className="p-4" data-testid={`provider-row-${status.provider}`}>
            <CardContent className="flex items-start gap-4 p-0">
              <div className="flex size-10 items-center justify-center rounded-md bg-surface-raised shrink-0">
                <Bot className="size-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {PROVIDER_LABELS[status.provider] ?? status.provider}
                  </span>
                  <StatusDot status={status} />
                  <span className={cn(
                    'text-xs',
                    status.error ? 'text-[var(--color-warning)]' : status.authenticated ? 'text-[var(--color-success)]' : 'text-muted-foreground',
                  )}>
                    {statusLabel(status)}
                  </span>
                </div>

                {status.authenticated && status.email && (
                  <p className="text-muted-foreground text-sm mt-0.5">{status.email}</p>
                )}

                {status.error && (
                  <p className="text-destructive text-sm mt-0.5" data-testid={`error-${status.provider}`}>
                    {status.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

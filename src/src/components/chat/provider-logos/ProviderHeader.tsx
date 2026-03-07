/**
 * ProviderHeader -- provider logo + name display for assistant messages.
 *
 * Shows a 16px SVG logo and the provider display name in muted xs text.
 * Falls back to just the name if the provider is unknown.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6).
 */

import type { ProviderId } from '@/types/provider';
import { ClaudeLogo } from '@/components/chat/provider-logos/ClaudeLogo';
import { GeminiLogo } from '@/components/chat/provider-logos/GeminiLogo';
import { CodexLogo } from '@/components/chat/provider-logos/CodexLogo';

interface ProviderHeaderProps {
  providerId: ProviderId;
}

const PROVIDER_CONFIG: Record<ProviderId, { name: string; Logo: React.ComponentType<{ className?: string }> }> = {
  claude: { name: 'Claude', Logo: ClaudeLogo },
  gemini: { name: 'Gemini', Logo: GeminiLogo },
  codex: { name: 'Codex', Logo: CodexLogo },
};

export function ProviderHeader({ providerId }: ProviderHeaderProps) {
  const config = PROVIDER_CONFIG[providerId];

  if (!config) {
    return (
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs text-muted">{providerId}</span>
      </div>
    );
  }

  const { name, Logo } = config;

  return (
    <div className="flex items-center gap-1.5 mb-1" data-testid="provider-header">
      <Logo className="size-4" />
      <span className="text-xs text-muted">{name}</span>
    </div>
  );
}

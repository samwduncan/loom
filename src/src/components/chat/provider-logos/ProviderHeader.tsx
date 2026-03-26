/**
 * ProviderHeader -- provider logo + name display for assistant messages.
 *
 * Shows a 16px SVG logo and the provider display name.
 * Claude logo animates (pulse + glow) when isStreaming is true.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6).
 */

import type { ProviderId } from '@/types/provider';
import { ClaudeLogo } from '@/components/chat/provider-logos/ClaudeLogo';
import { GeminiLogo } from '@/components/chat/provider-logos/GeminiLogo';
import { CodexLogo } from '@/components/chat/provider-logos/CodexLogo';

interface ProviderHeaderProps {
  providerId: ProviderId;
  isStreaming?: boolean;
}

const PROVIDER_CONFIG: Record<ProviderId, { name: string; Logo: React.ComponentType<{ className?: string; animated?: boolean }> }> = {
  claude: { name: 'Claude', Logo: ClaudeLogo },
  gemini: { name: 'Gemini', Logo: GeminiLogo },
  codex: { name: 'Codex', Logo: CodexLogo },
};

export function ProviderHeader({ providerId, isStreaming }: ProviderHeaderProps) {
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
      <Logo className="size-4" animated={isStreaming} />
      <span className="text-sm font-medium text-muted">{name}</span>
    </div>
  );
}

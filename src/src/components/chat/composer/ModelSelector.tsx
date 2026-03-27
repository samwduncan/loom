/**
 * ModelSelector -- compact popover for choosing the AI provider (Claude/Gemini/Codex).
 *
 * Renders a trigger button showing the current provider's icon and name,
 * with a popover listing all 3 providers. Selected provider is highlighted.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ProviderLogo } from '@/components/sidebar/ProviderLogo';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { ProviderId } from '@/types/provider';
import './model-selector.css';

const PROVIDER_NAMES: Record<ProviderId, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
};

const PROVIDERS: ProviderId[] = ['claude', 'gemini', 'codex'];

export interface ModelSelectorProps {
  selectedProvider: ProviderId;
  onSelect: (provider: ProviderId) => void;
}

export function ModelSelector({ selectedProvider, onSelect }: ModelSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="model-selector-trigger"
          data-testid="model-selector"
        >
          <ProviderLogo providerId={selectedProvider} size={14} />
          <span className="text-xs">{PROVIDER_NAMES[selectedProvider]}</span>
          <ChevronDown size={10} className="opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn(
          'w-40 p-1.5',
          'bg-surface-raised border border-border',
          'rounded-lg shadow-lg',
        )}
      >
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            data-testid="model-option"
            onClick={() => onSelect(provider)}
            className={cn(
              'model-selector-option',
              provider === selectedProvider && 'bg-surface-active',
            )}
          >
            <ProviderLogo providerId={provider} size={14} />
            <span>{PROVIDER_NAMES[provider]}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

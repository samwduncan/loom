import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type { SessionProvider } from '../../../../types/app';

interface ProviderOption {
  id: SessionProvider;
  name: string;
  model: string;
}

interface ProviderDropdownProps {
  provider: SessionProvider;
  modelLabel: string;
  onProviderChange: (provider: SessionProvider) => void;
  providers: ProviderOption[];
}

export default function ProviderDropdown({
  provider,
  modelLabel,
  onProviderChange,
  providers,
}: ProviderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const currentProviderName =
    provider === 'codex' ? 'Codex' : provider === 'gemini' ? 'Gemini' : 'Claude';

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-card/60 border border-border/40 hover:bg-card hover:border-border/60 transition-all duration-150 text-sm text-foreground"
      >
        <SessionProviderLogo provider={provider} className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium hidden md:inline truncate max-w-[160px]">
          {currentProviderName} ({modelLabel})
        </span>
        <span className="font-medium md:hidden truncate max-w-[80px]">
          {currentProviderName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-card/80 backdrop-blur-[16px] backdrop-saturate-[1.4] border border-border/50 rounded-xl shadow-lg z-[var(--z-dropdown)] overflow-hidden">
          {providers.map((p) => {
            const isActive = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onProviderChange(p.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-100 ${
                  isActive
                    ? 'bg-primary/8 text-foreground'
                    : 'text-foreground/80 hover:bg-accent/50'
                }`}
              >
                <SessionProviderLogo provider={p.id} className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left truncate">
                  {p.name} <span className="text-muted-foreground">({p.model})</span>
                </span>
                {isActive && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

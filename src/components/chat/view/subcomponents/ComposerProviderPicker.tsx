import { useEffect, useRef, useState } from 'react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type { SessionProvider } from '../../../../types/app';

const PROVIDERS: Array<{ id: SessionProvider; name: string }> = [
  { id: 'claude', name: 'Claude' },
  { id: 'codex', name: 'Codex' },
  { id: 'gemini', name: 'Gemini' },
];

interface ComposerProviderPickerProps {
  provider: SessionProvider;
  onProviderChange: (provider: SessionProvider) => void;
}

export default function ComposerProviderPicker({
  provider,
  onProviderChange,
}: ComposerProviderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  return (
    <div ref={pickerRef} className="relative">
      {/* Trigger: compact provider logo */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 ${
          isOpen
            ? 'border-primary/40 bg-primary/8'
            : 'border-border/40 bg-card/60 hover:bg-card hover:border-border/60'
        }`}
        title={`Switch provider (${provider === 'codex' ? 'Codex' : provider === 'gemini' ? 'Gemini' : 'Claude'})`}
      >
        <SessionProviderLogo provider={provider} className="w-5 h-5" />
      </button>

      {/* Popup above the button */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card/80 backdrop-blur-[16px] backdrop-saturate-[1.4] border border-border/50 rounded-xl shadow-lg z-[var(--z-dropdown)] p-1.5">
          <div className="flex gap-1">
            {PROVIDERS.map((p) => {
              const isActive = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onProviderChange(p.id);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-100 ${
                    isActive
                      ? 'bg-primary/10 ring-1 ring-primary/20'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <SessionProviderLogo provider={p.id} className="w-6 h-6" />
                  <span className="text-[10px] font-medium text-foreground/70">
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

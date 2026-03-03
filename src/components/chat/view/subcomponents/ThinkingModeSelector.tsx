import { useState, useRef, useEffect } from 'react';
import { Brain, X } from 'lucide-react';

import { thinkingModes } from '../../constants/thinkingModes';

type ThinkingModeSelectorProps = {
  selectedMode: string;
  onModeChange: (modeId: string) => void;
  onClose?: () => void;
  className?: string;
};

const MODE_LABELS: Record<string, { name: string; description: string; prefix: string }> = {
  'none': { name: 'Standard', description: 'Regular Claude response', prefix: '' },
  'think': { name: 'Think', description: 'Basic extended thinking', prefix: 'think' },
  'think-hard': { name: 'Think Hard', description: 'More thorough evaluation', prefix: 'think hard' },
  'think-harder': { name: 'Think Harder', description: 'Deep analysis with alternatives', prefix: 'think harder' },
  'ultrathink': { name: 'Ultrathink', description: 'Maximum thinking budget', prefix: 'ultrathink' },
};

function ThinkingModeSelector({ selectedMode, onModeChange, onClose, className = '' }: ThinkingModeSelectorProps) {
  // Create display modes with English labels
  const translatedModes = thinkingModes.map(mode => {
    const labels = MODE_LABELS[mode.id] || { name: mode.id, description: '', prefix: '' };
    return {
      ...mode,
      name: labels.name,
      description: labels.description,
      prefix: labels.prefix,
    };
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentMode = translatedModes.find(mode => mode.id === selectedMode) || translatedModes[0];
  const IconComponent = currentMode.icon || Brain;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${selectedMode === 'none'
            ? 'bg-surface-elevated hover:bg-muted'
            : 'bg-status-info/15 hover:bg-status-info/25'
          }`}
        title={`Thinking mode: ${currentMode.name}`}
      >
        <IconComponent className={`w-5 h-5 ${currentMode.color}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-surface-raised rounded-lg shadow-xl border border-border/10 overflow-hidden">
          <div className="p-3 border-b border-border/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Thinking Mode
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="p-1 hover:bg-surface-elevated rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Extended thinking gives Claude more time to evaluate alternatives
            </p>
          </div>

          <div className="py-1">
            {translatedModes.map((mode) => {
              const ModeIcon = mode.icon;
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                    if (onClose) onClose();
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-surface-elevated transition-colors ${isSelected ? 'bg-surface-elevated' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${mode.icon ? mode.color : 'text-muted-foreground'}`}>
                      {ModeIcon ? <ModeIcon className="w-5 h-5" /> : <div className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-foreground-secondary'
                          }`}>
                          {mode.name}
                        </span>
                        {isSelected && (
                          <span className="text-xs bg-status-info/15 text-status-info px-2 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                      {mode.prefix && (
                        <code className="text-xs bg-surface-elevated px-1.5 py-0.5 rounded mt-1 inline-block">
                          {mode.prefix}
                        </code>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-border/10 bg-surface-base">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Higher thinking modes take more time but provide more thorough analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThinkingModeSelector;
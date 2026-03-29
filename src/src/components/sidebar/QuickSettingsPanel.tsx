/**
 * QuickSettingsPanel -- Popover with three display preference toggles.
 *
 * Opens from the sidebar footer via click or Cmd+, shortcut.
 * Uses Popover (not DropdownMenu) so it stays open while toggling.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * token-based styling (3.1), cn() for classes (3.6).
 */

import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SlidersHorizontal } from 'lucide-react';
import { hapticSelection } from '@/lib/haptics';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { useQuickSettingsShortcut } from '@/hooks/useQuickSettingsShortcut';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export type QuickSettingsPanelProps = Record<string, never>;

export function QuickSettingsPanel(_props: QuickSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  const { thinkingExpanded, autoExpandTools, showRawParams } = useUIStore(
    useShallow((s) => ({
      thinkingExpanded: s.thinkingExpanded,
      autoExpandTools: s.autoExpandTools,
      showRawParams: s.showRawParams,
    })),
  );
  const toggleThinking = useUIStore((s) => s.toggleThinking);
  const toggleAutoExpandTools = useUIStore((s) => s.toggleAutoExpandTools);
  const toggleShowRawParams = useUIStore((s) => s.toggleShowRawParams);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useQuickSettingsShortcut(handleToggle);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-md',
            'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center',
            'text-muted hover:text-foreground hover:bg-surface-raised/50',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'transition-colors',
          )}
          aria-label="Quick settings"
          type="button"
        >
          <SlidersHorizontal size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className={cn(
          'w-56 p-3',
          'bg-surface-raised border border-border',
          'rounded-lg shadow-lg',
        )}
      >
        <h3 className="text-sm font-medium text-foreground mb-3">Quick Settings</h3>
        <div className="flex flex-col gap-3">
          {([
            { id: 'qs-thinking', label: 'Show thinking', desc: 'Expand thinking blocks by default', checked: thinkingExpanded, onChange: (_checked: boolean) => { hapticSelection(); toggleThinking(); } },
            { id: 'qs-auto-expand', label: 'Auto-expand tools', desc: 'Show tool call details automatically', checked: autoExpandTools, onChange: (_checked: boolean) => { hapticSelection(); toggleAutoExpandTools(); } },
            { id: 'qs-raw-params', label: 'Show raw params', desc: 'Display raw JSON parameters', checked: showRawParams, onChange: (_checked: boolean) => { hapticSelection(); toggleShowRawParams(); } },
          ] as const).map((toggle) => (
            <div key={toggle.id} className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor={toggle.id} className="text-sm cursor-pointer">
                  {toggle.label}
                </Label>
                <span className="text-xs text-muted">{toggle.desc}</span>
              </div>
              <Switch
                id={toggle.id}
                checked={toggle.checked}
                onCheckedChange={toggle.onChange}
                aria-label={toggle.label}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

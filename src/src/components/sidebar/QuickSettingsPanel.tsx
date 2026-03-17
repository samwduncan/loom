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
import { SlidersHorizontal } from 'lucide-react';
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

export function QuickSettingsPanel() {
  const [open, setOpen] = useState(false);

  const thinkingExpanded = useUIStore((s) => s.thinkingExpanded);
  const autoExpandTools = useUIStore((s) => s.autoExpandTools);
  const showRawParams = useUIStore((s) => s.showRawParams);
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
            'text-muted hover:text-foreground',
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
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="qs-thinking" className="text-sm cursor-pointer">
                Show thinking
              </Label>
              <span className="text-xs text-muted">Expand thinking blocks by default</span>
            </div>
            <Switch
              id="qs-thinking"
              checked={thinkingExpanded}
              onCheckedChange={toggleThinking}
              aria-label="Show thinking"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="qs-auto-expand" className="text-sm cursor-pointer">
                Auto-expand tools
              </Label>
              <span className="text-xs text-muted">Show tool call details automatically</span>
            </div>
            <Switch
              id="qs-auto-expand"
              checked={autoExpandTools}
              onCheckedChange={toggleAutoExpandTools}
              aria-label="Auto-expand tools"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="qs-raw-params" className="text-sm cursor-pointer">
                Show raw params
              </Label>
              <span className="text-xs text-muted">Display raw JSON parameters</span>
            </div>
            <Switch
              id="qs-raw-params"
              checked={showRawParams}
              onCheckedChange={toggleShowRawParams}
              aria-label="Show raw params"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

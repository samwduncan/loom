/**
 * AppearanceTab -- Font size slider with live preview, code font selector, density display.
 *
 * Reads theme from UIStore (synchronous, no loading state needed).
 * Updates CSS custom properties for instant visual feedback plus store for persistence.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * cn() for classes (3.6), no default export.
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const CODE_FONTS = [
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'Cascadia Code',
  'Menlo',
] as const;

export function AppearanceTab() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Apply current theme values to CSS variables on mount (for page refresh persistence)
  useEffect(() => {
    document.documentElement.style.setProperty('--text-body', `${theme.fontSize / 16}rem`);
    document.documentElement.style.setProperty('--font-code', theme.codeFontFamily);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Only on mount; slider/select handle live updates

  function handleFontSizeChange(value: number[]) {
    const size = value[0] ?? theme.fontSize; // ASSERT: Slider always returns at least one value
    document.documentElement.style.setProperty('--text-body', `${size / 16}rem`);
    setTheme({ fontSize: size });
  }

  function handleCodeFontChange(value: string) {
    document.documentElement.style.setProperty('--font-code', value);
    setTheme({ codeFontFamily: value });
  }

  return (
    <div className="space-y-6 p-1" data-testid="appearance-tab">
      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size-slider">Font Size</Label>
          <span className="text-sm text-muted-foreground" data-testid="font-size-value">
            {theme.fontSize}px
          </span>
        </div>
        <Slider
          id="font-size-slider"
          min={12}
          max={20}
          step={1}
          value={[theme.fontSize]}
          onValueChange={handleFontSizeChange}
          data-testid="font-size-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>12px</span>
          <span>20px</span>
        </div>
      </div>

      {/* Code Font */}
      <div className="space-y-3">
        <Label htmlFor="code-font-select">Code Font</Label>
        <Select value={theme.codeFontFamily} onValueChange={handleCodeFontChange}>
          <SelectTrigger id="code-font-select" className="w-full" data-testid="code-font-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_FONTS.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="rounded-md border p-3 text-sm font-[var(--font-code)]"
          data-testid="code-font-preview"
        >
          <code>const hello = &quot;world&quot;;</code>
        </div>
      </div>

      {/* Density (read-only) */}
      <div className="space-y-2">
        <Label>Density</Label>
        <p className="text-sm text-muted-foreground capitalize" data-testid="density-value">
          {theme.density}
        </p>
      </div>
    </div>
  );
}

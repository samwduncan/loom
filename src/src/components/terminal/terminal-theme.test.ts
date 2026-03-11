import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTerminalTheme } from './terminal-theme';

describe('getTerminalTheme', () => {
  const cssVarValues: Record<string, string> = {
    '--surface-base': 'rgb(46, 42, 40)',
    '--text-primary': 'rgb(228, 218, 210)',
    '--accent-primary': 'rgb(180, 90, 70)',
    '--status-error': 'rgb(170, 70, 55)',
    '--status-success': 'rgb(100, 170, 90)',
    '--status-warning': 'rgb(190, 160, 70)',
    '--status-info': 'rgb(100, 140, 200)',
    '--text-muted': 'rgb(140, 130, 120)',
  };

  let getComputedStyleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const mockStyle = {
      getPropertyValue: vi.fn((name: string) => cssVarValues[name] ?? ''),
    } as unknown as CSSStyleDeclaration;

    getComputedStyleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue(mockStyle);
  });

  afterEach(() => {
    getComputedStyleSpy.mockRestore();
  });

  it('returns an ITheme object with all expected keys', () => {
    const theme = getTerminalTheme();

    // Core properties
    expect(theme.background).toBe('rgb(46, 42, 40)');
    expect(theme.foreground).toBe('rgb(228, 218, 210)');
    expect(theme.cursor).toBe('rgb(180, 90, 70)');
    expect(theme.cursorAccent).toBe('rgb(46, 42, 40)');
    expect(theme.selectionBackground).toBe('rgba(255,255,255,0.15)');
  });

  it('maps ANSI colors from CSS custom properties', () => {
    const theme = getTerminalTheme();

    expect(theme.black).toBe('rgb(46, 42, 40)');
    expect(theme.red).toBe('rgb(170, 70, 55)');
    expect(theme.green).toBe('rgb(100, 170, 90)');
    expect(theme.yellow).toBe('rgb(190, 160, 70)');
    expect(theme.blue).toBe('rgb(100, 140, 200)');
    expect(theme.magenta).toBe('rgb(180, 90, 70)');
    expect(theme.cyan).toBe('#56d4dd');
    expect(theme.white).toBe('rgb(228, 218, 210)');
  });

  it('uses hardcoded hex for bright ANSI colors', () => {
    const theme = getTerminalTheme();

    expect(theme.brightBlack).toBe('rgb(140, 130, 120)');
    expect(theme.brightRed).toBe('#ff6b6b');
    expect(theme.brightGreen).toBe('#69db7c');
    expect(theme.brightYellow).toBe('#ffd43b');
    expect(theme.brightBlue).toBe('#74c0fc');
    expect(theme.brightMagenta).toBe('#da77f2');
    expect(theme.brightCyan).toBe('#66d9e8');
    expect(theme.brightWhite).toBe('#ffffff');
  });

  it('reads CSS variables from document.documentElement', () => {
    getTerminalTheme();

    expect(getComputedStyleSpy).toHaveBeenCalledWith(document.documentElement);
  });

  it('calls getPropertyValue with correct CSS variable names', () => {
    const theme = getTerminalTheme();

    // Trigger all property reads by accessing theme (already done above)
    // Verify the mock was called with expected variable names
    const mockStyle = getComputedStyleSpy.mock.results[0]
      ?.value as CSSStyleDeclaration;
    const calls = (mockStyle.getPropertyValue as ReturnType<typeof vi.fn>).mock
      .calls.map((c: string[]) => c[0]);

    expect(calls).toContain('--surface-base');
    expect(calls).toContain('--text-primary');
    expect(calls).toContain('--accent-primary');
    expect(calls).toContain('--status-error');
    expect(calls).toContain('--status-success');
    expect(calls).toContain('--status-warning');
    expect(calls).toContain('--status-info');
    expect(calls).toContain('--text-muted');

    // Ensure theme is used to avoid unused var warning
    expect(theme).toBeDefined();
  });
});

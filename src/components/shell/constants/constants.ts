import type { ITerminalOptions } from '@xterm/xterm';
import { catppuccinMocha } from '../../../shared/catppuccin-mocha';

export const CODEX_DEVICE_AUTH_URL = 'https://auth.openai.com/codex/device';
export const SHELL_RESTART_DELAY_MS = 200;
export const TERMINAL_INIT_DELAY_MS = 100;
export const TERMINAL_RESIZE_DELAY_MS = 50;

export const TERMINAL_OPTIONS: ITerminalOptions = {
  cursorBlink: true,
  cursorStyle: 'bar',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  lineHeight: 1.2,
  allowProposedApi: true,
  allowTransparency: false,
  convertEol: true,
  scrollback: 10000,
  tabStopWidth: 4,
  windowsMode: false,
  macOptionIsMeta: true,
  macOptionClickForcesSelection: true,
  theme: {
    background: catppuccinMocha.base,
    foreground: catppuccinMocha.text,
    cursor: catppuccinMocha.rosewater,
    cursorAccent: catppuccinMocha.base,
    selectionBackground: catppuccinMocha.surface2 + '80',
    selectionForeground: catppuccinMocha.text,
    black: catppuccinMocha.surface1,
    red: catppuccinMocha.red,
    green: catppuccinMocha.green,
    yellow: catppuccinMocha.yellow,
    blue: catppuccinMocha.blue,
    magenta: catppuccinMocha.pink,
    cyan: catppuccinMocha.teal,
    white: catppuccinMocha.subtext1,
    brightBlack: catppuccinMocha.overlay0,
    brightRed: catppuccinMocha.red,
    brightGreen: catppuccinMocha.green,
    brightYellow: catppuccinMocha.yellow,
    brightBlue: catppuccinMocha.blue,
    brightMagenta: catppuccinMocha.pink,
    brightCyan: catppuccinMocha.teal,
    brightWhite: catppuccinMocha.text,
  },
};

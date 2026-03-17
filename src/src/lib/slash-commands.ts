/**
 * Slash command registry -- static list of available / commands.
 *
 * Each command defines its id, display label, and description.
 * Execution logic lives in the consumer (ChatComposer), not here.
 *
 * Constitution: Named exports only (2.2).
 */

import type { SlashCommand } from '@/types/slash-command';

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'clear', label: '/clear', description: 'Clear conversation history' },
  { id: 'help', label: '/help', description: 'Show available commands' },
  { id: 'compact', label: '/compact', description: 'Compact conversation context' },
  { id: 'model', label: '/model', description: 'Switch AI model' },
];

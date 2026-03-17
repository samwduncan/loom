/**
 * SlashCommand -- type for / command entries in the composer command picker.
 *
 * Used by useSlashCommands hook and SlashCommandPicker component.
 * Actions are handled by the consumer (ChatComposer), not the type itself.
 *
 * Constitution: Named exports only (2.2).
 */

export interface SlashCommand {
  id: string; // e.g., "clear"
  label: string; // e.g., "/clear"
  description: string; // e.g., "Clear conversation history"
  icon?: string; // Optional lucide icon name
}

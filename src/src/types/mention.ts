/**
 * FileMention -- type for file references in the composer via @ mentions.
 *
 * Used by useFileMentions hook and MentionPicker component.
 *
 * Constitution: Named exports only (2.2).
 */

export interface FileMention {
  path: string; // Full relative path (e.g., "src/components/App.tsx")
  name: string; // Filename only (e.g., "App.tsx")
}

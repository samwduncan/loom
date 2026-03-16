/**
 * MentionChipRow -- horizontal row of removable file mention chips.
 *
 * Renders above the textarea in the composer. Each chip shows the filename
 * with an X button to remove. Full path shown on hover via title attribute.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1), cn() (3.6).
 */

import { X } from 'lucide-react';
import type { FileMention } from '@/types/mention';

interface MentionChipRowProps {
  mentions: FileMention[];
  onRemove: (path: string) => void;
}

export function MentionChipRow({ mentions, onRemove }: MentionChipRowProps) {
  if (mentions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2" data-testid="mention-chip-row">
      {mentions.map((mention) => (
        <span
          key={mention.path}
          className="mention-chip"
          title={mention.path}
          data-testid="mention-chip"
        >
          <span className="mention-chip-name">{mention.name}</span>
          <button
            type="button"
            className="mention-chip-remove"
            onClick={() => onRemove(mention.path)}
            aria-label={`Remove ${mention.name}`}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

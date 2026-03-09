/**
 * export-conversation -- Markdown and JSON export for chat conversations.
 *
 * Downloads conversation as a file using the Blob + anchor click pattern.
 * Markdown format: structured headings per role, tool summaries, token metadata.
 * JSON format: full message data with image binary data stripped.
 *
 * Constitution: Named exports (2.2).
 */

import type { Message } from '@/types/message';

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/** Lowercase, replace non-alphanumeric with hyphens, collapse, trim hyphens */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Markdown export
// ---------------------------------------------------------------------------

/**
 * Export messages as Markdown file.
 *
 * Format: title heading, then per message:
 * - User: ## User + content
 * - Assistant: ## Assistant + content + tool summaries + token footer
 * - Error: blockquote with Error prefix
 * - System: italic
 *
 * Excludes: thinking blocks, full tool outputs, image binary data.
 */
export function exportAsMarkdown(messages: Message[], sessionTitle: string): void {
  const parts: string[] = [`# ${sessionTitle}\n\n`];

  for (const msg of messages) {
    switch (msg.role) {
      case 'user':
        parts.push(`## User\n\n${msg.content}\n\n`);
        break;

      case 'assistant': {
        parts.push(`## Assistant\n\n${msg.content}\n\n`);

        // Tool call summaries
        if (msg.toolCalls?.length) {
          for (const tc of msg.toolCalls) {
            const inputStr = JSON.stringify(tc.input).slice(0, 100);
            parts.push(`> **${tc.toolName}**: ${inputStr}\n\n`);
          }
        }

        // Token metadata footer
        const { inputTokens, outputTokens, cost } = msg.metadata;
        if (inputTokens != null || outputTokens != null) {
          const costStr = cost != null ? ` -- $${cost}` : '';
          parts.push(`*${inputTokens ?? 0} in / ${outputTokens ?? 0} out${costStr}*\n\n`);
        }
        break;
      }

      case 'error':
        parts.push(`> **Error:** ${msg.content}\n\n`);
        break;

      case 'system':
        parts.push(`*${msg.content}*\n\n`);
        break;

      case 'task_notification':
        parts.push(`> *${msg.content}*\n\n`);
        break;

      default:
        break;
    }
  }

  const filename = `${slugify(sessionTitle)}-${formatDate()}.md`;
  downloadFile(parts.join(''), filename, 'text/markdown');
}

// ---------------------------------------------------------------------------
// JSON export
// ---------------------------------------------------------------------------

/**
 * Export messages as JSON file.
 *
 * Includes full message data with metadata and tool calls.
 * Strips image binary data (data: URLs) but keeps reference paths.
 */
export function exportAsJSON(messages: Message[], sessionTitle: string): void {
  const cleanMessages = messages.map((msg) => {
    const cleaned = { ...msg };

    // Strip image binary data
    if (cleaned.attachments?.length) {
      cleaned.attachments = cleaned.attachments.map((att) => ({
        ...att,
        url: att.url.startsWith('data:') ? `[binary:${att.name}]` : att.url,
      }));
    }

    return cleaned;
  });

  const data = {
    title: sessionTitle,
    exportedAt: new Date().toISOString(),
    messages: cleanMessages,
  };

  const filename = `${slugify(sessionTitle)}-${formatDate()}.json`;
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

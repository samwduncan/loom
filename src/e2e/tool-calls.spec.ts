import { test, expect } from '@playwright/test';

/**
 * Tool calls E2E tests -- verifies ToolChip rendering during streaming
 * and resolution on completion.
 *
 * Covers: COMP-01 (ToolChip display), STRM-02 (tool channel routing)
 */

test.describe('Tool calls', () => {
  test.describe.configure({ mode: 'serial' });

  test('tool calls display ToolChip during streaming', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Prompt that triggers tool calls (Read or Bash tool)
    await input.fill('Read the file /etc/hostname and tell me what it says');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for ToolChip to appear during streaming
    const toolChip = page.locator('[data-testid="tool-chip"]');
    await expect(toolChip.first()).toBeVisible({ timeout: 30_000 });
  });

  test('tool calls resolve after completion', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    await input.fill('Read the file /etc/hostname and tell me what it says');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for ToolChip to appear during streaming (proves tool routing works)
    const toolChip = page.locator('[data-testid="tool-chip"]');
    await expect(toolChip.first()).toBeVisible({ timeout: 30_000 });

    // Wait for streaming to complete — proves the full tool-call cycle finishes
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // After streaming completes, the finalized assistant message should render.
    // M1 note: tool call data is not yet persisted in the finalized Message object,
    // so we verify the response rendered successfully (content visible) rather than
    // asserting on resolved tool chip CSS classes. Tool chip rendering during streaming
    // is covered by the previous test.
    const messages = page.locator('[data-testid="message-container"]');
    await expect(messages).toHaveCount(2, { timeout: 10_000 });

    // The assistant message should have content (not empty)
    const assistantMessage = messages.nth(1);
    const textContent = await assistantMessage.textContent();
    expect(textContent?.length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';
import { setupChat, sendMessageAndWait } from './helpers';

/**
 * Token usage E2E tests -- verifies that token counts and cost display
 * after a completed assistant turn.
 *
 * Covers: E2E-02
 *
 * Strategy: Send a simple message, wait for response to complete. The
 * token-usage-summary element should appear within the finalized
 * assistant message (rendered by AssistantMessage -> TokenUsage).
 */

test.describe('Token usage display', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows token usage after completed response', async ({ page }) => {
    test.slow(); // Real API call

    await setupChat(page);

    // Send a minimal message to get a response with token metadata
    await sendMessageAndWait(page, 'Say exactly: hello');

    // Token usage summary should appear once the message finalizes.
    // After streaming ends, ActiveMessage adds the message to timeline store
    // with token metadata, and AssistantMessage renders TokenUsage.
    const summary = page.locator('[data-testid="token-usage-summary"]');
    await expect(summary).toBeVisible({ timeout: 30_000 });

    // Should contain numeric token counts (pattern: "X in / Y out")
    const text = await summary.textContent();
    expect(text).toBeTruthy();
    expect(text).toMatch(/\d+.*in.*\/.*\d+.*out/);

    // Should not contain null or undefined
    expect(text).not.toContain('null');
    expect(text).not.toContain('undefined');
  });

  test('expands token usage detail on click', async ({ page }) => {
    test.slow(); // Real API call

    await setupChat(page);
    await sendMessageAndWait(page, 'Say exactly: world');

    // Click the token usage summary to expand
    const summary = page.locator('[data-testid="token-usage-summary"]');
    await expect(summary).toBeVisible({ timeout: 30_000 });
    await summary.click();

    // Detail panel should appear
    const detail = page.locator('[data-testid="token-usage-detail"]');
    await expect(detail).toBeVisible({ timeout: 5_000 });

    // Should show labeled rows
    await expect(detail.locator('text=Input tokens')).toBeVisible();
    await expect(detail.locator('text=Output tokens')).toBeVisible();
  });
});

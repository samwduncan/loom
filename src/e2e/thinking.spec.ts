import { test, expect } from '@playwright/test';

/**
 * Thinking blocks E2E tests -- verifies ThinkingDisclosure appears during
 * extended reasoning and streaming completes successfully.
 *
 * Covers: STRM-02 (thinking channel routing)
 *
 * NOTE: Thinking blocks only appear if the model uses extended thinking,
 * which is not guaranteed for all prompts. The test asserts the response
 * completes successfully regardless. If thinking does appear, it validates
 * the ThinkingDisclosure component renders correctly.
 */

test.describe('Thinking blocks', () => {
  test.describe.configure({ mode: 'serial' });

  test('thinking blocks appear during extended reasoning', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Prompt that may trigger extended thinking
    await input.fill('Think carefully step by step: what is 17 * 23?');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to start
    await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
      timeout: 30_000,
    });

    // Check for thinking disclosure -- may or may not appear depending on model behavior
    const thinkingDisclosure = page.locator('[data-testid="thinking-disclosure"]');
    const thinkingAppeared = await thinkingDisclosure.isVisible().catch(() => false);

    if (thinkingAppeared) {
      // Validate thinking block has content
      await expect(thinkingDisclosure).toBeVisible();
      const triggerText = await thinkingDisclosure.locator('.thinking-disclosure-trigger').textContent();
      expect(triggerText).toBeTruthy();
    }

    // Regardless of thinking, streaming must complete successfully
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // Verify response rendered
    const messages = page.locator('[data-testid="message-container"]');
    await expect(messages).toHaveCount(2, { timeout: 10_000 });
  });
});

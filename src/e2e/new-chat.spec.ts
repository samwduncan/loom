import { test, expect } from '@playwright/test';

/**
 * New chat E2E tests -- verifies optimistic stub session behavior:
 * user message appears immediately, then URL reconciles to real session ID.
 *
 * Covers: NAV-02 (new chat optimistic flow)
 */

test.describe('New chat', () => {
  test.describe.configure({ mode: 'serial' });

  test('new chat shows optimistic user message immediately', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    // Wait for composer to be ready
    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    const messageText = 'Optimistic test message ' + Date.now();
    await input.fill(messageText);
    await page.locator('[aria-label="Send message"]').click();

    // User message should appear IMMEDIATELY (optimistic) -- short timeout
    await expect(page.locator(`text=${messageText}`)).toBeVisible({
      timeout: 3_000,
    });

    // Wait for streaming to complete
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // URL should contain a real session ID (not stub-)
    await page.waitForURL(/\/chat\/(?!stub-)/, { timeout: 10_000 });
    expect(page.url()).not.toContain('stub-');
  });
});

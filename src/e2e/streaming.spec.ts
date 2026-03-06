import { test, expect } from '@playwright/test';

/**
 * Streaming E2E tests -- verifies WebSocket connection, message sending,
 * and streaming response on the /chat route.
 *
 * Covers: STRM-01 (WS connects), STRM-02 (multiplexer routes), STRM-03 (rAF buffer renders)
 */

test.describe('Streaming on /chat', () => {
  test.describe.configure({ mode: 'serial' });

  test('establishes WebSocket connection on /chat', async ({ page }) => {
    // Filter for app WS (not Vite HMR which connects to /?token=)
    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    const ws = await wsPromise;

    expect(ws.url()).toContain('/ws?token=');
  });

  test('sends message and receives streaming response', async ({ page }) => {
    test.slow(); // Real API call -- needs extended timeout

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    // Wait for composer to be ready
    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Send a short message to minimize API cost and response time
    await input.fill('Say exactly: hello world');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming content to appear
    await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
      timeout: 30_000,
    });

    // Wait for streaming to complete (cursor disappears on finalization)
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // Verify at least user + assistant messages rendered
    const messages = page.locator('[data-testid="message-container"]');
    await expect(messages).toHaveCount(2, { timeout: 10_000 });
  });
});

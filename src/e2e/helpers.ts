import { type Page, expect } from '@playwright/test';

/**
 * E2E test helpers -- shared patterns for Loom chat E2E tests.
 *
 * Known issue: After streaming completes and stub session reconciles
 * to a real session ID, messages may briefly appear then vanish due to
 * session re-initialization race. The workaround is to wait for
 * "Response complete" status, then poll for stabilized message rendering.
 */

/**
 * Navigate to /chat, wait for WS connection, return composer input locator.
 */
export async function setupChat(page: Page) {
  const wsPromise = page.waitForEvent('websocket', {
    predicate: (ws) => ws.url().includes('/ws?token='),
  });
  await page.goto('/chat');
  await wsPromise;

  const input = page.locator('[aria-label="Message input"]');
  await expect(input).toBeVisible({ timeout: 10_000 });

  return { input };
}

/**
 * Send a message and wait for the full response cycle to complete.
 * Waits for active-message, streaming cursor hidden, and Response complete status.
 */
export async function sendMessageAndWait(page: Page, message: string) {
  const input = page.locator('[aria-label="Message input"]');
  await input.fill(message);
  await page.locator('[aria-label="Send message"]').click();

  // Wait for streaming to start -- active-message should appear
  await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
    timeout: 60_000,
  });

  // Wait for streaming to finish -- cursor hidden
  await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
    timeout: 90_000,
  });
}

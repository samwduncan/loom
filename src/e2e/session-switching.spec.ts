import { test, expect } from '@playwright/test';

/**
 * Session switching E2E tests -- verifies sidebar session list renders,
 * clicking a session updates URL, and messages load.
 *
 * Covers: NAV-01 (sidebar click updates URL), NAV-02 (messages load on switch)
 */

test.describe('Session switching', () => {
  test.describe.configure({ mode: 'serial' });

  test('sidebar shows sessions after first chat', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    // Send a message to create a session
    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('Say exactly: test session');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to complete
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // Sidebar should contain at least one session item
    const sidebar = page.locator('[role="complementary"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });
    const sessions = sidebar.locator('[role="option"]');
    // Use first() + toBeVisible instead of exact count -- other sessions may exist from prior runs
    await expect(sessions.first()).toBeVisible({ timeout: 15_000 });
  });

  test('clicking a session updates URL and loads messages', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    // Wait for sidebar to load with existing sessions
    const sidebar = page.locator('[role="complementary"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Wait for at least one session to appear (from previous test or prior runs)
    const sessions = sidebar.locator('[role="option"]');
    const count = await sessions.count();
    if (count === 0) {
      // Create a session if none exist
      const input = page.locator('[aria-label="Message input"]');
      await expect(input).toBeVisible({ timeout: 10_000 });
      await input.fill('Say exactly: create session');
      await page.locator('[aria-label="Send message"]').click();
      await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
        timeout: 90_000,
      });
    }

    // Click the first session
    const firstSession = sessions.first();
    await expect(firstSession).toBeVisible({ timeout: 10_000 });
    await firstSession.click();

    // URL should contain a session ID
    await page.waitForURL(/\/chat\/.+/, { timeout: 5_000 });
    expect(page.url()).toMatch(/\/chat\/[a-zA-Z0-9-]+/);

    // Messages should appear
    const messages = page.locator('[data-testid="message-container"]');
    await expect(messages.first()).toBeVisible({ timeout: 10_000 });
    expect(await messages.count()).toBeGreaterThanOrEqual(1);
  });
});

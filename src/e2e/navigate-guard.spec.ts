import { test, expect } from '@playwright/test';

/**
 * Navigate-away guard E2E test -- verifies beforeunload fires during streaming.
 *
 * Covers: E2E-11 (closing tab during active streaming shows confirmation dialog)
 *
 * Sends a message, and while streaming is active, attempts page.close()
 * which triggers the beforeunload event. The useNavigateAwayGuard hook
 * registers a handler that calls event.returnValue to show confirmation.
 *
 * Playwright handles this via the 'dialog' event for beforeunload dialogs.
 */

test.describe('Navigate-away guard', () => {
  test('shows confirmation dialog during active streaming', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    // Wait for app to be ready
    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 15_000 });

    // Set up dialog handler BEFORE triggering navigation during streaming
    let dialogFired = false;
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      dialogMessage = dialog.message();
      await dialog.accept(); // Accept to let the navigation proceed
    });

    // Send a message that will produce a longer response to ensure streaming window
    await input.fill('Write a short paragraph about the weather today. Take your time.');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to START (active-message appears with streaming cursor)
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeVisible({
      timeout: 30_000,
    });

    // Trigger real beforeunload by navigating away during streaming.
    // The useNavigateAwayGuard hook sets event.returnValue (not preventDefault),
    // which Playwright surfaces as a 'dialog' event.
    try {
      await page.goto('about:blank', { timeout: 5_000 });
    } catch {
      // Navigation may be blocked by the dialog
    }

    // Verify the dialog fired.
    // Note: Chromium doesn't include custom beforeunload messages in dialog.message()
    // (returns empty string). The important assertion is that the dialog appeared at all,
    // which proves the beforeunload handler was registered by useNavigateAwayGuard.
    expect(dialogFired).toBe(true);
  });
});

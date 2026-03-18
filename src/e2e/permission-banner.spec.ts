import { test, expect } from '@playwright/test';

/**
 * Permission banner E2E tests -- verifies the tool permission request UI:
 * countdown ring, tool name display, Allow/Deny buttons, Y/N keyboard shortcuts.
 *
 * Covers: E2E-01
 *
 * Strategy: Navigate to /chat/{fake-session}, inject synthetic permission
 * requests into the stream store (exposed on window in dev mode), then
 * verify banner rendering and keyboard shortcuts.
 *
 * Uses fake session URL to give PermissionBanner a matching sessionId prop.
 * No real API calls needed -- fast and deterministic.
 */

const FAKE_SESSION_ID = 'e2e-permission-test';

/**
 * Set up chat with a fake session URL.
 */
async function setupWithSession(page: import('@playwright/test').Page) {
  const wsPromise = page.waitForEvent('websocket', {
    predicate: (ws) => ws.url().includes('/ws?token='),
  });
  await page.goto(`/chat/${FAKE_SESSION_ID}`);
  await wsPromise;

  // Wait for page to settle (chat view should render even with unknown session)
  await page.waitForTimeout(1000);
}

/**
 * Inject a synthetic permission request into the stream store.
 */
async function injectPermission(
  page: import('@playwright/test').Page,
  requestId: string,
  toolName: string,
  input: Record<string, unknown>,
) {
  return page.evaluate(
    ({ requestId, toolName, input, sessionId }) => {
      // ASSERT: dev-mode window exposure of Zustand store for E2E testing
      const store = (window as Record<string, unknown>).__ZUSTAND_STREAM_STORE__ as {
        getState: () => {
          setPermissionRequest: (req: Record<string, unknown>) => void;
        };
      } | undefined;

      if (!store) return false;

      store.getState().setPermissionRequest({
        requestId,
        toolName,
        input,
        sessionId,
        receivedAt: Date.now(),
      });
      return true;
    },
    { requestId, toolName, input, sessionId: FAKE_SESSION_ID },
  );
}

test.describe('Permission banner', () => {
  test.describe.configure({ mode: 'serial' });

  test('renders banner with tool name, preview, and buttons', async ({ page }) => {
    await setupWithSession(page);

    const injected = await injectPermission(page, 'req-1', 'Bash', {
      command: 'echo "permission-test-ok"',
    });

    if (!injected) {
      test.skip(true, 'Stream store not accessible in dev mode');
      return;
    }

    const banner = page.locator('[data-testid="permission-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    // Verify tool name
    await expect(banner.locator('text=Bash')).toBeVisible();

    // Verify command preview
    await expect(banner.locator('text=permission-test-ok')).toBeVisible();

    // Verify Allow and Deny buttons
    await expect(banner.locator('text=Allow')).toBeVisible();
    await expect(banner.locator('text=Deny')).toBeVisible();
  });

  test('Y key dismisses banner (allow)', async ({ page }) => {
    await setupWithSession(page);

    const injected = await injectPermission(page, 'req-2', 'Bash', {
      command: 'echo "y-key-test"',
    });

    if (!injected) {
      test.skip(true, 'Stream store not accessible');
      return;
    }

    const banner = page.locator('[data-testid="permission-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    // Blur input so keyboard shortcut fires
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    await page.keyboard.press('y');
    await expect(banner).toBeHidden({ timeout: 5_000 });
  });

  test('N key dismisses banner (deny)', async ({ page }) => {
    await setupWithSession(page);

    const injected = await injectPermission(page, 'req-3', 'Write', {
      file_path: '/tmp/test.txt',
    });

    if (!injected) {
      test.skip(true, 'Stream store not accessible');
      return;
    }

    const banner = page.locator('[data-testid="permission-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    await page.keyboard.press('n');
    await expect(banner).toBeHidden({ timeout: 5_000 });
  });

  test('Allow button click dismisses banner', async ({ page }) => {
    await setupWithSession(page);

    const injected = await injectPermission(page, 'req-4', 'Edit', {
      file_path: '/tmp/edit-test.ts',
    });

    if (!injected) {
      test.skip(true, 'Stream store not accessible');
      return;
    }

    const banner = page.locator('[data-testid="permission-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    await banner.locator('text=Allow').click();
    await expect(banner).toBeHidden({ timeout: 5_000 });
  });
});

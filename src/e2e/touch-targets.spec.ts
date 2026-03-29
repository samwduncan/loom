import { test, expect } from '@playwright/test';

/**
 * Touch Target Compliance E2E tests -- validates interactive elements
 * meet Apple's 44px minimum height at mobile viewport (375px width).
 *
 * Covers: TOUCH-01 through TOUCH-06
 *
 * NOTE: Viewport is set BEFORE navigation so CSS media queries evaluate
 * at mobile dimensions. Does NOT use setupChat helper (which navigates
 * at the config's default Desktop Chrome viewport).
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const MIN_TOUCH_TARGET = 44;

/**
 * Known elements that are intentionally smaller than 44px and are
 * NOT covered by TOUCH-01 through TOUCH-06 requirements.
 * These are tracked for future phases.
 */
const KNOWN_EXCEPTIONS = new Set([
  'Skip to main content',   // Accessibility skip link (1px, invisible by design)
  'Reconnect',              // Connection banner button (future fix)
  'Default',                // Quick settings provider button (future fix)
]);

test.describe('Touch Target Compliance', () => {
  test('ChatEmptyState template buttons meet 44px on mobile (TOUCH-04)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // ChatEmptyState template buttons are visible on the empty chat page
    const templateButtons = page.locator('[data-testid="template-category"] button');
    const count = await templateButtons.count();

    // Should have template buttons (3 categories x 4 templates = 12)
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await templateButtons.nth(i).boundingBox();
      expect(box, `Template button ${i} should be visible`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box!.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
  });

  test('chat view buttons meet 44px minimum on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // Scan all visible buttons (excluding known exceptions and textarea)
    const violations = await page.evaluate((args) => {
      const { minSize, exceptions } = args;
      const buttons = document.querySelectorAll('button');
      const issues: Array<{ text: string; ariaLabel: string | null; height: number }> = [];

      for (const el of buttons) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const text = (el.textContent || '').trim().slice(0, 40);
        const label = el.getAttribute('aria-label');

        // Skip known exceptions not in TOUCH-01-06 scope
        if (exceptions.includes(text) || (label && exceptions.includes(label))) continue;

        if (rect.height < minSize) {
          issues.push({
            text,
            ariaLabel: label,
            height: Math.round(rect.height * 100) / 100,
          });
        }
      }
      return issues;
    }, { minSize: MIN_TOUCH_TARGET, exceptions: [...KNOWN_EXCEPTIONS] });

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  <button> "${v.text || v.ariaLabel || '(no label)'}" height=${v.height}px`)
        .join('\n');
      expect(violations, `Touch target violations in chat view:\n${report}`).toHaveLength(0);
    }
  });

  test('sidebar interactive elements meet 44px minimum on mobile (TOUCH-06)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // Sidebar defaults to open. On mobile (375px), it renders as a fixed overlay.
    // Check if sidebar is already visible; if not, open it via hamburger.
    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    if (!sidebarVisible) {
      const menuButton = page.locator('[aria-label="Open menu"]');
      await expect(menuButton).toBeVisible({ timeout: 5_000 });
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Measure sidebar buttons (new chat, settings, close, session items, project headers)
    const sidebarButtons = sidebar.locator('button, [role="option"]');
    const count = await sidebarButtons.count();

    const violations: Array<{ text: string; height: number }> = [];

    for (let i = 0; i < count; i++) {
      const el = sidebarButtons.nth(i);
      const box = await el.boundingBox();
      if (!box || box.width === 0 || box.height === 0) continue;
      // Skip off-screen elements
      if (box.y + box.height < 0 || box.y > MOBILE_VIEWPORT.height) continue;

      if (box.height < MIN_TOUCH_TARGET) {
        const text = await el.textContent().catch(() => '');
        const label = await el.getAttribute('aria-label').catch(() => '');
        violations.push({
          text: (text || label || '(no label)').trim().slice(0, 40),
          height: Math.round(box.height * 100) / 100,
        });
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  "${v.text}" height=${v.height}px`)
        .join('\n');
      expect(violations, `Sidebar touch target violations:\n${report}`).toHaveLength(0);
    }
  });

  test('ThinkingDisclosure trigger meets 44px at mobile viewport (CSS validation)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // ThinkingDisclosure only renders during streaming with thinking content.
    // Inject a mock element with the .thinking-disclosure-trigger class to
    // validate the CSS min-height rule applies at mobile viewport.
    const height = await page.evaluate(() => {
      const el = document.createElement('button');
      el.className = 'thinking-disclosure-trigger';
      el.textContent = 'Mock thinking disclosure';
      document.body.appendChild(el);
      const h = el.getBoundingClientRect().height;
      el.remove();
      return h;
    });

    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  test('ToolCardShell header meets 44px at mobile viewport (CSS validation)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // ToolCardShell only renders when tool calls are present.
    // Inject a mock element to validate CSS min-height.
    const height = await page.evaluate(() => {
      const el = document.createElement('button');
      el.className = 'tool-card-shell-header';
      el.textContent = 'Mock tool card header';
      document.body.appendChild(el);
      const h = el.getBoundingClientRect().height;
      el.remove();
      return h;
    });

    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  test('context-menu-item meets 44px at mobile viewport (CSS validation)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // Context menu items only render on right-click.
    // Inject a mock element to validate CSS min-height.
    const height = await page.evaluate(() => {
      const el = document.createElement('button');
      el.className = 'context-menu-item';
      el.textContent = 'Mock context menu item';
      document.body.appendChild(el);
      const h = el.getBoundingClientRect().height;
      el.remove();
      return h;
    });

    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  // TOUCH-05: LiveSessionBanner Detach button -- requires live CLI session to render.
  // Manual verification: attach a live session, measure Detach button height in Safari DevTools.
  // Cannot be automated without a real Claude CLI session running.
});

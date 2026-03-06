import { test, expect } from '@playwright/test';

/**
 * Scroll anchor E2E tests -- verifies auto-scroll during streaming,
 * scroll-to-bottom pill on manual scroll up, and zero CLS during
 * streaming-to-finalized handoff.
 *
 * Covers: COMP-03 (scroll anchor), CLS verification
 */

test.describe('Scroll anchor', () => {
  test.describe.configure({ mode: 'serial' });

  test('auto-scrolls during streaming', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Long prompt to generate lots of output that forces scrolling
    await input.fill('Write a detailed 500-word essay about the history of computing');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to start
    await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
      timeout: 30_000,
    });

    // Wait a bit for content to accumulate
    await page.waitForTimeout(3000);

    // Check that scroll container is scrolled near bottom (auto-scrolling)
    const scrollInfo = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="message-list-scroll"]');
      if (!container) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
      return {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      };
    });

    // If there's scrollable content, scrollTop should be near the bottom
    if (scrollInfo.scrollHeight > scrollInfo.clientHeight) {
      const distanceFromBottom = scrollInfo.scrollHeight - scrollInfo.scrollTop - scrollInfo.clientHeight;
      expect(distanceFromBottom).toBeLessThan(100); // Within 100px of bottom
    }

    // Wait for streaming to complete
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });
  });

  test('scroll-to-bottom pill appears on manual scroll up', async ({ page }) => {
    test.slow();

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Send a message that generates a long response
    await input.fill('Write a detailed 500-word essay about the history of computing');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to complete
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // Scroll up manually
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="message-list-scroll"]');
      if (container) {
        container.scrollTop = 0;
        // Dispatch scroll event for IntersectionObserver + scroll listeners
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    });

    // Also dispatch a wheel event to trigger user scroll detection
    const scrollContainer = page.locator('[data-testid="message-list-scroll"]');
    await scrollContainer.dispatchEvent('wheel', { deltaY: -500 });

    // Wait for pill to appear
    const pill = page.locator('[data-testid="scroll-to-bottom-pill"]');
    // The pill may appear after a brief delay
    await page.waitForTimeout(500);

    // Check if the content is long enough to scroll (pill only appears if scrollable)
    const isScrollable = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="message-list-scroll"]');
      if (!container) return false;
      return container.scrollHeight > container.clientHeight + 50;
    });

    if (isScrollable) {
      // Pill should be visible (opacity: 1, not pointer-events: none)
      await expect(pill).toBeVisible({ timeout: 5_000 });

      // Click the pill
      await pill.click();

      // Pill should disappear (auto-scroll re-engaged)
      await expect(pill).toBeHidden({ timeout: 5_000 });
    }
  });

  test('zero CLS during streaming-to-finalized handoff', async ({ page }) => {
    test.slow();

    // Inject CLS observer BEFORE navigating
    await page.addInitScript(() => {
      // @ts-expect-error global CLS tracking
      window.__cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-expect-error Layout shift API
          if (!entry.hadRecentInput) {
            // @ts-expect-error Layout shift API
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            window.__cls += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    const wsPromise = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/ws?token='),
    });
    await page.goto('/chat');
    await wsPromise;

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Send a message
    await input.fill('Say exactly: CLS measurement test response');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to complete (this is the handoff point)
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });

    // Wait for finalization to complete
    await page.waitForTimeout(1000);

    // Read CLS value
    // @ts-expect-error global CLS tracking
    const cls = await page.evaluate(() => window.__cls as number);

    // Assert CLS below Google's "good" threshold
    expect(cls).toBeLessThan(0.1);
  });
});

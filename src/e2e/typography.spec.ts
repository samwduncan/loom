import { test, expect } from '@playwright/test';

/**
 * Typography Mobile Compliance E2E tests -- validates font sizes, line heights,
 * and truncation behavior at mobile viewport (375x812 iPhone dimensions).
 *
 * Covers: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-07
 *
 * NOTE: Viewport is set BEFORE navigation so CSS media queries evaluate
 * at mobile dimensions. Does NOT use setupChat helper (which navigates
 * at the config's default Desktop Chrome viewport).
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Typography mobile compliance', () => {
  test('TYPO-01: no visible text below 12px on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    const violations = await page.evaluate(() => {
      const MIN_FONT_SIZE = 12;
      const issues: Array<{ tag: string; text: string; fontSize: string; className: string }> = [];

      // Known exceptions: badge counts (text-[10px]), desktop-only hints (lg: guard), dev components
      const EXCEPTION_CLASSES = ['text-\\[10px\\]', 'lg:'];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const text = (node.textContent || '').trim();
            if (!text) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      const seen = new Set<Element>();

      while (walker.nextNode()) {
        const textNode = walker.currentNode;
        const el = textNode.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        // Check if element or ancestors are hidden
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // Skip known exception classes
        const fullClassName = el.className?.toString() || '';
        const isException = EXCEPTION_CLASSES.some((cls) => fullClassName.includes(cls.replace('\\', '')));
        if (isException) continue;

        // Also skip if any ancestor has an exception class
        let ancestor = el.parentElement;
        let ancestorException = false;
        while (ancestor) {
          const ancestorClass = ancestor.className?.toString() || '';
          if (EXCEPTION_CLASSES.some((cls) => ancestorClass.includes(cls.replace('\\', '')))) {
            ancestorException = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (ancestorException) continue;

        const fontSize = parseFloat(style.fontSize);
        if (fontSize < MIN_FONT_SIZE) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            text: (textNode.textContent || '').trim().slice(0, 40),
            fontSize: style.fontSize,
            className: fullClassName.slice(0, 60),
          });
        }
      }
      return issues;
    });

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  <${v.tag}> "${v.text}" fontSize=${v.fontSize} class="${v.className}"`)
        .join('\n');
      expect(violations, `Sub-12px font-size violations on mobile:\n${report}`).toHaveLength(0);
    }
  });

  test('TYPO-04: chat message body text >= 15px on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // Check for .markdown-body elements (finalized messages)
    const markdownBodies = page.locator('.markdown-body');
    const count = await markdownBodies.count();

    if (count === 0) {
      // Empty chat -- no messages to check. Skip gracefully.
      test.skip(true, 'No messages loaded -- TYPO-04 requires chat content for verification');
      return;
    }

    for (let i = 0; i < count; i++) {
      const fontSize = await markdownBodies.nth(i).evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize, `.markdown-body[${i}] font-size should be >= 15px on mobile`).toBeGreaterThanOrEqual(15);
    }
  });

  test('TYPO-07: chat message line-height ratio >= 1.6 on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    const markdownBodies = page.locator('.markdown-body');
    const count = await markdownBodies.count();

    if (count === 0) {
      test.skip(true, 'No messages loaded -- TYPO-07 requires chat content for verification');
      return;
    }

    for (let i = 0; i < count; i++) {
      const ratio = await markdownBodies.nth(i).evaluate((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight);
        return lineHeight / fontSize;
      });
      expect(ratio, `.markdown-body[${i}] line-height/font-size ratio should be >= 1.6`).toBeGreaterThanOrEqual(1.6);
    }
  });

  test('TYPO-02: ThinkingDisclosure trigger >= 14px on mobile (CSS validation)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // ThinkingDisclosure only renders during streaming with thinking content.
    // Inject a mock element to validate the CSS font-size rule at mobile viewport.
    const fontSize = await page.evaluate(() => {
      const el = document.createElement('button');
      el.className = 'thinking-disclosure-trigger';
      el.textContent = 'Mock thinking trigger';
      document.body.appendChild(el);
      const size = parseFloat(window.getComputedStyle(el).fontSize);
      el.remove();
      return size;
    });

    expect(fontSize).toBeGreaterThanOrEqual(14);
  });

  test('TYPO-03: session title truncation on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/chat');
    await page.waitForSelector('[aria-label="Message input"]', { timeout: 10_000 });

    // Open sidebar on mobile if not visible
    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    if (!sidebarVisible) {
      const menuButton = page.locator('[aria-label="Open menu"]');
      const menuExists = await menuButton.isVisible().catch(() => false);
      if (menuExists) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Check session items for truncation styles
    const sessionTitles = page.locator('[role="option"] .truncate');
    const count = await sessionTitles.count();

    if (count === 0) {
      test.skip(true, 'No session items visible -- TYPO-03 requires sessions for verification');
      return;
    }

    for (let i = 0; i < count; i++) {
      const styles = await sessionTitles.nth(i).evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          overflow: computed.overflow,
          textOverflow: computed.textOverflow,
          whiteSpace: computed.whiteSpace,
        };
      });

      expect(styles.overflow, `Session title[${i}] should have overflow: hidden`).toBe('hidden');
      expect(styles.textOverflow, `Session title[${i}] should have text-overflow: ellipsis`).toBe('ellipsis');
      expect(styles.whiteSpace, `Session title[${i}] should have white-space: nowrap`).toBe('nowrap');
    }
  });
});

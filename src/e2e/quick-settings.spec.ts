import { test, expect } from '@playwright/test';

/**
 * Quick settings E2E test -- verifies toggle persistence across page reload.
 *
 * Covers: E2E-09 (quick settings persist across reload)
 *
 * Opens the Quick Settings popover, toggles the "Show thinking" switch,
 * reloads the page, re-opens the popover, and verifies the toggle persisted.
 */

test.describe('Quick settings', () => {
  test('toggle persists across page reload', async ({ page }) => {
    test.slow();

    await page.goto('/chat');

    // Wait for app to be ready (composer visible = auth + project context resolved)
    await expect(page.locator('[aria-label="Message input"]')).toBeVisible({
      timeout: 15_000,
    });

    // Open Quick Settings popover (gear icon in sidebar footer)
    const trigger = page.locator('[aria-label="Quick settings"]');
    await expect(trigger).toBeVisible({ timeout: 5_000 });
    await trigger.click();

    // Wait for popover content to appear
    const popover = page.locator('text=Quick Settings');
    await expect(popover).toBeVisible({ timeout: 5_000 });

    // Find the "Show thinking" toggle (first toggle in the list)
    const thinkingSwitch = page.locator('[aria-label="Show thinking"]');
    await expect(thinkingSwitch).toBeVisible({ timeout: 3_000 });

    // Record initial state
    const initialChecked = await thinkingSwitch.getAttribute('data-state');
    const isChecked = initialChecked === 'checked';

    // Toggle it to the opposite state
    await thinkingSwitch.click();

    // Verify the toggle changed
    const newState = isChecked ? 'unchecked' : 'checked';
    await expect(thinkingSwitch).toHaveAttribute('data-state', newState, {
      timeout: 3_000,
    });

    // Reload the page
    await page.reload();

    // Wait for app to be ready again
    await expect(page.locator('[aria-label="Message input"]')).toBeVisible({
      timeout: 15_000,
    });

    // Re-open Quick Settings
    const triggerAfterReload = page.locator('[aria-label="Quick settings"]');
    await expect(triggerAfterReload).toBeVisible({ timeout: 5_000 });
    await triggerAfterReload.click();

    // Verify the toggle persisted
    const thinkingSwitchAfterReload = page.locator('[aria-label="Show thinking"]');
    await expect(thinkingSwitchAfterReload).toBeVisible({ timeout: 5_000 });
    await expect(thinkingSwitchAfterReload).toHaveAttribute('data-state', newState, {
      timeout: 3_000,
    });

    // Toggle back to restore original state (cleanup)
    await thinkingSwitchAfterReload.click();
    await expect(thinkingSwitchAfterReload).toHaveAttribute(
      'data-state',
      initialChecked ?? 'unchecked',
      { timeout: 3_000 },
    );
  });
});

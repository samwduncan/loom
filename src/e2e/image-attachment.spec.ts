import { test, expect } from '@playwright/test';
import { setupChat } from './helpers';

/**
 * Image attachment E2E tests -- verifies paste/drop-to-attach in the composer.
 *
 * Covers: E2E-03
 *
 * Strategy: Navigate to /chat, simulate dropping a small PNG image via
 * a synthetic drag-drop event, verify the preview thumbnail appears.
 * Second test sends the message with an image attachment.
 *
 * Uses drop (not paste) because Chromium's ClipboardEvent constructor
 * makes clipboardData read-only, but DragEvent's dataTransfer is writable.
 */

// Minimal 1x1 red PNG (68 bytes) encoded as base64
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

/**
 * Dispatch a synthetic drop event on the composer with a PNG file.
 */
async function dropImageOnComposer(page: import('@playwright/test').Page) {
  return page.evaluate(async (pngBase64: string) => {
    // Convert base64 to bytes
    const binary = atob(pngBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], 'test-image.png', { type: 'image/png' });

    // Create DataTransfer with the file
    const dt = new DataTransfer();
    dt.items.add(file);

    // Find the composer container (has onDrop handler)
    const textarea = document.querySelector('[aria-label="Message input"]');
    if (!textarea) return 'no-textarea';

    // Walk up to find the drop target
    let dropTarget: Element | null = textarea;
    let parent = textarea.parentElement;
    // Walk up to the div that has the onDrop handler (composer outer wrapper)
    while (parent && !parent.getAttribute('class')?.includes('composer')) {
      parent = parent.parentElement;
    }
    if (parent) dropTarget = parent;

    // Dispatch drag events to trigger the drop handler
    dropTarget.dispatchEvent(new DragEvent('dragenter', {
      bubbles: true, cancelable: true, dataTransfer: dt,
    }));
    dropTarget.dispatchEvent(new DragEvent('dragover', {
      bubbles: true, cancelable: true, dataTransfer: dt,
    }));
    dropTarget.dispatchEvent(new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer: dt,
    }));

    return 'ok';
  }, TINY_PNG_BASE64);
}

test.describe('Image attachment', () => {
  test.describe.configure({ mode: 'serial' });

  test('drop image shows preview in composer', async ({ page }) => {
    await setupChat(page);

    const result = await dropImageOnComposer(page);
    expect(result).toBe('ok');

    // Wait for image preview to appear in composer area
    // ImagePreviewCard renders img with alt={fileName}
    const previewImg = page.locator('img[alt="test-image.png"]');
    await expect(previewImg).toBeVisible({ timeout: 5_000 });
  });

  test('sends message with dropped image', async ({ page }) => {
    test.slow(); // Real API call with image

    await setupChat(page);

    await dropImageOnComposer(page);

    // Wait for preview
    await expect(page.locator('img[alt="test-image.png"]')).toBeVisible({ timeout: 5_000 });

    // Type message alongside the image
    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Describe this image in one word');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for streaming to start
    await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
      timeout: 60_000,
    });

    // Wait for streaming to complete
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 90_000,
    });
  });
});

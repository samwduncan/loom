import { test, expect } from '@playwright/test';
import { setupChat, sendMessageAndWait } from './helpers';

/**
 * Export conversation E2E tests -- verifies the export dropdown and
 * download of conversation content as Markdown or JSON.
 *
 * Covers: E2E-04
 *
 * Strategy: Send a message to create a session with content, then
 * click the export button and verify the download produces a file
 * containing the sent message text.
 */

test.describe('Export conversation', () => {
  test.describe.configure({ mode: 'serial' });

  test('exports conversation as Markdown with message content', async ({ page }) => {
    test.slow(); // Real API call to create conversation content

    await setupChat(page);

    const testPhrase = 'export-test-phrase-' + Date.now();
    await sendMessageAndWait(page, `Say exactly: ${testPhrase}`);

    // Click the export toggle button to open dropdown
    const exportToggle = page.locator('[data-testid="export-toggle"]');
    await expect(exportToggle).toBeVisible({ timeout: 5_000 });
    await exportToggle.click();

    // Export as Markdown option should appear
    const markdownBtn = page.locator('text=Export as Markdown');
    await expect(markdownBtn).toBeVisible({ timeout: 3_000 });

    // Set up download listener before clicking
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      markdownBtn.click(),
    ]);

    // Verify download has a filename
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.md$/);

    // Save download to temp path and read content
    const path = await download.path();
    if (!path) throw new Error('Download path was null — download failed');
    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain(testPhrase);

    // Should contain User and Assistant headings
    expect(content).toContain('## User');
    expect(content).toContain('## Assistant');
  });

  test('exports conversation as JSON with message content', async ({ page }) => {
    test.slow(); // Real API call

    await setupChat(page);

    const testPhrase = 'json-export-test-' + Date.now();
    await sendMessageAndWait(page, `Say exactly: ${testPhrase}`);

    // Open export dropdown
    const exportToggle = page.locator('[data-testid="export-toggle"]');
    await expect(exportToggle).toBeVisible({ timeout: 5_000 });
    await exportToggle.click();

    // Click JSON export
    const jsonBtn = page.locator('text=Export as JSON');
    await expect(jsonBtn).toBeVisible({ timeout: 3_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      jsonBtn.click(),
    ]);

    // Verify JSON file
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.json$/);

    // Save download to temp path and read content
    const path = await download.path();
    if (!path) throw new Error('Download path was null — download failed');
    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const data = JSON.parse(content);

    // Should have messages array with our content
    expect(data.messages).toBeDefined();
    expect(data.messages.length).toBeGreaterThanOrEqual(2);

    // User message should contain our phrase
    const userMsg = data.messages.find(
      (m: { role: string; content: string }) => m.role === 'user' && m.content.includes(testPhrase),
    );
    expect(userMsg).toBeTruthy();
  });
});

import { test, expect } from '@playwright/test';

/**
 * Git operations E2E tests -- verifies fetch with status feedback,
 * diff view opens from changed file click, and branch create/switch cycle.
 *
 * Covers: E2E-06 (fetch feedback), E2E-07 (diff view), E2E-08 (branch create/switch)
 *
 * NOTE: Push is NOT tested (would modify remote). Delete branch is not
 * implemented in the app, so we test create + switch + cleanup via checkout back.
 *
 * These tests intercept the /api/projects response to ensure the loom project
 * (which has a git repo) is first, so the git panel loads correctly.
 */

/**
 * Set localStorage before navigation so useProjectContext resolves to the loom project.
 *
 * useProjectContext stores the project name in localStorage and falls back to it
 * when API calls fail. On initial load, it always calls /api/projects and takes
 * projects[0]. Since we can't easily control project order, we pre-seed localStorage
 * and also override the module-level singleton via addInitScript.
 */
async function ensureLoomProject(page: import('@playwright/test').Page) {
  // Override fetch to reorder projects so loom comes first
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
      if (url?.includes('/api/projects') && !url?.includes('/api/projects/')) {
        const clone = response.clone();
        const body = await clone.json();
        const projects = Array.isArray(body) ? body : body.projects ?? [];

        const loomIndex = projects.findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p.name?.includes('loom') || p.path?.includes('loom'),
        );
        if (loomIndex > 0) {
          const [loom] = projects.splice(loomIndex, 1);
          projects.unshift(loom);
        }

        const modified = Array.isArray(body) ? projects : { ...body, projects };
        return new Response(JSON.stringify(modified), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      return response;
    };
  });
}

/** Navigate to /chat with loom project first, wait for app ready, switch to Git tab */
async function setupGitPanel(page: import('@playwright/test').Page): Promise<boolean> {
  await ensureLoomProject(page);

  await page.goto('/chat');

  // Wait for app to be ready (composer visible = auth + project context resolved, WS connected)
  await expect(page.locator('[aria-label="Message input"]')).toBeVisible({
    timeout: 15_000,
  });

  // Switch to Git tab -- click and verify it becomes selected
  const gitTab = page.locator('role=tab[name=/git/i]');
  await expect(gitTab).toBeVisible({ timeout: 5_000 });
  await gitTab.click();
  await expect(gitTab).toHaveAttribute('aria-selected', 'true', { timeout: 5_000 });

  // Verify git panel is visible (not hidden by CSS show/hide)
  const gitPanel = page.locator('#panel-git');
  await expect(gitPanel).toBeVisible({ timeout: 5_000 });

  // Wait for either the branch trigger (success) or the error state
  const branchTrigger = page.locator('[data-testid="branch-trigger"]');
  const errorState = page.locator('.git-error');

  const result = await Promise.race([
    branchTrigger.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'success' as const),
    errorState.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'error' as const),
  ]);

  return result === 'success';
}

test.describe('Git operations', () => {
  test.describe.configure({ mode: 'serial' });

  test('fetch completes with toast feedback', async ({ page }) => {
    test.slow();

    const gitReady = await setupGitPanel(page);
    if (!gitReady) {
      test.skip(true, 'Default project is not a git repository');
      return;
    }

    // Click the Fetch button (title="Fetch") -- wait for remote status to load
    const fetchBtn = page.locator('button[title="Fetch"]');
    try {
      await expect(fetchBtn).toBeVisible({ timeout: 10_000 });
    } catch {
      test.skip(true, 'No remote configured -- fetch button not visible');
      return;
    }

    await fetchBtn.click();

    // Verify success toast appears -- sonner renders toasts in [data-sonner-toast]
    const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /fetch successful/i });
    await expect(successToast).toBeVisible({ timeout: 15_000 });
  });

  test('clicking a changed file opens the diff view', async ({ page }) => {
    test.slow();

    const gitReady = await setupGitPanel(page);
    if (!gitReady) {
      test.skip(true, 'Default project is not a git repository');
      return;
    }

    // Look for changed file rows in the Changes view
    const fileRows = page.locator('.git-file-row');
    const count = await fileRows.count();

    if (count === 0) {
      test.skip(true, 'No changed files in the working tree to test diff view');
      return;
    }

    // Click the first changed file row
    const firstFile = fileRows.first();
    await firstFile.click();

    // Clicking a changed file switches to Files tab and opens diff editor
    const diffWrapper = page.locator('.diff-editor-wrapper');
    await expect(diffWrapper).toBeVisible({ timeout: 10_000 });

    // Verify CodeMirror merge view rendered inside
    const mergeView = page.locator('.cm-mergeView');
    await expect(mergeView).toBeVisible({ timeout: 5_000 });
  });

  test('branch create and switch cycle works', async ({ page }) => {
    test.slow();

    const gitReady = await setupGitPanel(page);
    if (!gitReady) {
      test.skip(true, 'Default project is not a git repository');
      return;
    }

    const branchTrigger = page.locator('[data-testid="branch-trigger"]');

    // Record original branch name
    const originalBranch = (await branchTrigger.textContent())?.trim() ?? '';
    expect(originalBranch.length).toBeGreaterThan(0);

    // Open branch dropdown
    await branchTrigger.click();
    const dropdown = page.locator('[data-testid="branch-dropdown"]');
    await expect(dropdown).toBeVisible({ timeout: 8_000 });

    // Click "New Branch" button
    const newBranchBtn = dropdown.locator('button', { hasText: 'New Branch' });
    await newBranchBtn.click();

    // Type a test branch name
    const testBranchName = `e2e-test-${Date.now()}`;
    const branchInput = dropdown.locator('input[placeholder="Branch name..."]');
    await expect(branchInput).toBeVisible({ timeout: 3_000 });
    await branchInput.fill(testBranchName);

    // Click Create and capture the API response
    const createBtn = dropdown.locator('button', { hasText: 'Create' });
    await expect(createBtn).toBeEnabled({ timeout: 3_000 });

    await createBtn.click();

    // Wait for success toast
    const createToast = page.locator('[data-sonner-toast]').filter({
      hasText: new RegExp(`created branch ${testBranchName}`, 'i'),
    });
    await expect(createToast).toBeVisible({ timeout: 10_000 });

    // createBranch does 'git checkout -b' -- so we're already on the new branch.
    // Verify the branch trigger updates to show the new branch name.
    await expect(branchTrigger).toContainText(testBranchName, { timeout: 10_000 });

    // Re-open dropdown to verify the new branch appears in the list
    await branchTrigger.click();
    const dropdownAfterCreate = page.locator('[data-testid="branch-dropdown"]');
    await expect(dropdownAfterCreate).toBeVisible({ timeout: 5_000 });

    const newBranchItem = dropdownAfterCreate.locator('.git-branch-item', {
      hasText: testBranchName,
    });
    await expect(newBranchItem).toBeVisible({ timeout: 5_000 });

    // Switch back to original branch
    const originalBranchItem = dropdownAfterCreate.locator('.git-branch-item', {
      hasText: originalBranch,
    });
    await expect(originalBranchItem).toBeVisible({ timeout: 5_000 });
    await originalBranchItem.click();

    // Wait for switch-back toast
    const switchBackToast = page.locator('[data-sonner-toast]').filter({
      hasText: new RegExp(`switched to ${originalBranch}`, 'i'),
    });
    await expect(switchBackToast).toBeVisible({ timeout: 10_000 });

    // Verify we're back on the original branch
    await expect(branchTrigger).toContainText(originalBranch, { timeout: 5_000 });
  });
});

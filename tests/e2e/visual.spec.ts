import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

    test('Doctor Dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');

        // Wait for stability
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot('doctor-dashboard.png');
    });

    test('Clinical Workspace (Draft)', async ({ page }) => {
        // Assume logged in (or use test.use storageState in future)
        await page.goto('/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();
            await expect(page).toHaveURL(/\/patient\/.+/);

            // Type some draft text to ensure distinct state
            await page.locator('textarea[placeholder*="History of Present Illness"]').fill('Visual Test Draft Content');

            await page.waitForTimeout(500); // Wait for potential auto-save or UI settle
            await expect(page).toHaveScreenshot('clinical-workspace.png');
        }
    });

    test('AI Scribe Panel', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();

            // Open Scribe logic: it's embedded in the workspace as per code
            const scribeHeader = page.locator('text=AI Clinical Scribe');
            await expect(scribeHeader).toBeVisible();
            await expect(page.locator('button:has-text("Start Scribe")')).toBeVisible();

            // Screenshot just the scribe panel? Or full page?
            // Let's capture the panel specifically if possible, or viewport
            // Capturing panel:
            const panel = page.locator('.space-y-4').filter({ hasText: 'AI Clinical Scribe' }).first();
            await expect(panel).toHaveScreenshot('ai-scribe-panel.png');
        }
    });

    test('Admin Revenue Dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@medflow.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');

        await page.goto('/admin/revenue');
        await expect(page.locator('text=Admin Only')).toBeVisible();
        await page.waitForTimeout(1000); // Animations
        await expect(page).toHaveScreenshot('admin-revenue-initial.png');
    });

    test('Offline Banner', async ({ page, context }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        await context.setOffline(true);
        const banner = page.locator('text=You are currently offline');
        await expect(banner).toBeVisible();

        // Capture banner specifically or top of page
        // Let's capture viewport
        await expect(page).toHaveScreenshot('offline-state.png');
    });

});

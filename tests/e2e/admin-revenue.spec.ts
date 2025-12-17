import { test, expect } from '@playwright/test';

test.describe('Admin Revenue Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@medflow.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');
    });

    test('accesses revenue intelligence and runs audit', async ({ page }) => {
        // Navigate
        await page.goto('/admin/revenue');

        // Assert Admin Badge
        await expect(page.locator('text=Admin Only')).toBeVisible();

        // Synthetic Controls (Phase 6)
        // Generate Data first to ensure we have something to audit
        await page.click('button:has-text("Generate 50 Patients")');
        // Wait for generation (Loader)
        await expect(page.locator('text=Generating')).not.toBeVisible({ timeout: 10000 });

        // Run Audit
        await page.click('button:has-text("Run Revenue Audit")');

        // Wait for results
        await expect(page.locator('text=Analyzing')).not.toBeVisible({ timeout: 10000 });

        // Verify KPIs
        await expect(page.locator('text=Est. Leakage')).toBeVisible();
        await expect(page.locator('text=High Risk Patients')).toBeVisible();

        // Verify Table has rows
        const rows = page.locator('tbody tr');
        expect(await rows.count()).toBeGreaterThan(0);
    });
});

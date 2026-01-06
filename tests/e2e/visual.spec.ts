import { test, expect } from './fixtures';

test.describe('Visual Regression', () => {
    test('Dashboard loads correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page.getByText(/MedFlow/i).first()).toBeVisible();

        await expect(page).toHaveScreenshot('dashboard.png', {
            maxDiffPixels: 100,
            timeout: 10000
        });
    });

    test('Patient Detail page loads', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await page.waitForURL(/\/patient\/.+/);
            await page.waitForTimeout(500);

            await expect(page).toHaveScreenshot('patient-detail.png', {
                maxDiffPixels: 100,
                timeout: 10000
            });
        }
    });

    test('Ops Command Center loads', async ({ page }) => {
        await page.goto('/ops');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page.getByText('Ops Command Center')).toBeVisible();

        await expect(page).toHaveScreenshot('ops-command-center.png', {
            maxDiffPixels: 100,
            timeout: 10000
        });
    });

    test('Bed Manager loads', async ({ page }) => {
        await page.goto('/beds');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('bed-manager.png', {
            maxDiffPixels: 100,
            timeout: 10000
        });
    });

    test('Triage view loads', async ({ page }) => {
        await page.goto('/?view=triage');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('triage-view.png', {
            maxDiffPixels: 100,
            timeout: 10000
        });
    });
});

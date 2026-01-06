import { test, expect } from './fixtures';

test('Verify Dashboard and Patient Detail Visuals', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Capture Dashboard
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });

    // Navigate to Patient Detail
    const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
    if (await patientItem.count() > 0) {
        await patientItem.click();
        await page.waitForURL(/\/patient\/.+/);
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'screenshots/patient-detail.png', fullPage: true });

        const clinicalTab = page.locator('button').filter({ hasText: 'Clinical' });
        if (await clinicalTab.count() > 0) {
            await clinicalTab.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'screenshots/clinical-tab.png', fullPage: true });
        }
    }
});

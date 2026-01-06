import { test, expect } from './fixtures';

test.describe('UX Review Screenshot Capture', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    const outputDir = 'tests/e2e/ux-artifacts';

    test('1. Dashboard Main', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: `${outputDir}/1_dashboard-main.png`, fullPage: false });
    });

    test('2. Dashboard - Patient Lists', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await page.screenshot({ path: `${outputDir}/2_dashboard-patient-lists.png` });
    });

    test('3. Clinical Workspace', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await page.waitForURL(/\/patient\/.+/);
            await page.waitForTimeout(1000);

            await page.screenshot({ path: `${outputDir}/3_patient-clinical-workspace.png` });
        }
    });

    test('4. Orders Tab', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await page.waitForURL(/\/patient\/.+/);

            const ordersTab = page.locator('button').filter({ hasText: 'Orders' });
            if (await ordersTab.count() > 0) {
                await ordersTab.click();
                await page.waitForTimeout(500);
            }

            await page.screenshot({ path: `${outputDir}/4_patient-orders.png` });
        }
    });

    test('5. Vitals Tab', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await page.waitForURL(/\/patient\/.+/);

            const vitalsTab = page.locator('button').filter({ hasText: 'Vitals' });
            if (await vitalsTab.count() > 0) {
                await vitalsTab.click();
                await page.waitForTimeout(500);
            }

            await page.screenshot({ path: `${outputDir}/5_patient-vitals.png` });
        }
    });

    test('6. Ops Command Center', async ({ page }) => {
        await page.goto('/ops');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: `${outputDir}/6_ops-command-center.png` });
    });

    test('7. Bed Manager', async ({ page }) => {
        await page.goto('/beds');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: `${outputDir}/7_bed-manager.png` });
    });

    test('8. Triage View', async ({ page }) => {
        await page.goto('/?view=triage');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await page.screenshot({ path: `${outputDir}/8_triage-view.png` });
    });

    test('9. Admin Revenue Dashboard', async ({ page }) => {
        await page.goto('/admin/revenue');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: `${outputDir}/9_admin-revenue.png` });
    });
});

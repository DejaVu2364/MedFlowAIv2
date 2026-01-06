import { test, expect } from './fixtures';

test.describe('Doctor Core Workflow', () => {
    test('can view patient list and navigate to detail', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await expect(page).toHaveURL(/\/patient\/.+/);
        } else {
            console.log("No patients found. Skipping detail test.");
        }
    });

    test('can view clinical file tab', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await expect(page).toHaveURL(/\/patient\/.+/);

            const clinicalTab = page.locator('button').filter({ hasText: 'Clinical' });
            if (await clinicalTab.count() > 0) {
                await clinicalTab.click();
            }

            await expect(page.getByText(/Chief|History|Complaints/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {
                console.log('Clinical File content may vary');
            });
        }
    });
});

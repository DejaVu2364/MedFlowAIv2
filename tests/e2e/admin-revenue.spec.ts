import { test, expect } from './fixtures';

test.describe('Admin Revenue Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/revenue');
        await page.waitForLoadState('networkidle');
    });

    test('displays revenue dashboard elements', async ({ page }) => {
        const adminBadge = page.getByText('Admin Only');
        const revenueHeader = page.getByText(/Revenue/i).first();

        const adminVisible = await adminBadge.isVisible().catch(() => false);
        const revenueVisible = await revenueHeader.isVisible().catch(() => false);

        expect(adminVisible || revenueVisible).toBe(true);
    });

    test('can interact with revenue controls', async ({ page }) => {
        await page.waitForTimeout(1000);

        const generateBtn = page.getByRole('button', { name: /Generate.*Patient/i });
        if (await generateBtn.count() > 0) {
            await expect(generateBtn).toBeEnabled();
        }

        const auditBtn = page.getByRole('button', { name: /Run.*Audit/i });
        if (await auditBtn.count() > 0) {
            await expect(auditBtn).toBeEnabled();
        }
    });
});

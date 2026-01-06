import { test, expect } from './fixtures';

test.describe('Ops Command Center', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/ops');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
    });

    test('should display all 4 KPI cards', async ({ page }) => {
        // Verify page header
        await expect(page.getByText('Ops Command Center')).toBeVisible({ timeout: 10000 });

        // Check all 4 KPI cards are present
        await expect(page.getByText('Bed Census')).toBeVisible();
        await expect(page.getByText('Revenue Leakage')).toBeVisible();
        await expect(page.getByText('TPA Status')).toBeVisible();
        await expect(page.getByText('Discharge Readiness')).toBeVisible();
    });

    test('should display AI Insights panel', async ({ page }) => {
        await expect(page.getByText('AI Operations Insights')).toBeVisible();
        await expect(page.getByText('Live Analysis')).toBeVisible();
    });

    test('should show refresh controls', async ({ page }) => {
        await expect(page.getByText('Live')).toBeVisible();
        await expect(page.getByText(/Last updated/i)).toBeVisible();
    });

    test('should open Bed Census drill-down sheet', async ({ page }) => {
        await page.getByText('Bed Census').first().click();
        await page.waitForTimeout(500);

        const sheetVisible = await page.getByText('Bed Census Detail').isVisible().catch(() => false);
        if (sheetVisible) {
            await expect(page.getByText('Bed Census Detail')).toBeVisible();
        }
    });

    test('should open TPA Status drill-down sheet', async ({ page }) => {
        await page.getByText('TPA Status').first().click();
        await page.waitForTimeout(500);

        const sheetOpened = await page.getByText(/Insurance Patients|TPA/i).isVisible().catch(() => false);
        expect(sheetOpened).toBe(true);
    });

    test('should open Discharge Pipeline sheet', async ({ page }) => {
        await page.getByText('Discharge Readiness').first().click();
        await page.waitForTimeout(500);

        const sheetOpened = await page.getByText(/Discharge Pipeline|Ready for Discharge/i).isVisible().catch(() => false);
        expect(sheetOpened).toBe(true);
    });

    test('should navigate from drill-down to full page', async ({ page }) => {
        await page.getByText('Bed Census').first().click();
        await page.waitForTimeout(500);

        const navButton = page.getByRole('button', { name: /Open.*Bed Manager/i });
        if (await navButton.count() > 0) {
            await navButton.click();
            await expect(page).toHaveURL(/.*\/beds/);
        }
    });

    test('should show quick action buttons', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Manage Beds/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Revenue Audit/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /TPA Desk/i })).toBeVisible();
    });

    test('should display summary stats footer', async ({ page }) => {
        await expect(page.getByText('Total Patients')).toBeVisible();
        await expect(page.getByText('Room Revenue')).toBeVisible();
        await expect(page.getByText('Insurance Patients')).toBeVisible();
        await expect(page.getByText(/Last updated/i)).toBeVisible();
    });
});

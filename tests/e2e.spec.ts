import { test, expect } from '@playwright/test';

test.describe('MedFlow AI E2E', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Mock Gemini API to prevent timeouts
        await page.route('**/generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    department: 'General Medicine',
                                    suggested_triage: 'Green',
                                    confidence: 0.95
                                })
                            }]
                        }
                    }]
                })
            });
        });
    });

    test('should load dashboard with patient lists', async ({ page }) => {
        // Check for patient list sections
        const inTreatment = page.getByText('In Treatment');
        const awaiting = page.getByText(/Awaiting|Queue/i);

        // At least one section should be visible
        await expect(inTreatment.or(awaiting).first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to patient detail', async ({ page }) => {
        // Find and click a patient
        const patientItem = page.locator('.cursor-pointer').filter({ hasText: /\d+y/ }).first();
        if (await patientItem.count() > 0) {
            await patientItem.click();
            await expect(page).toHaveURL(/\/patient\/.+/);

            // Verify tabs are visible
            await expect(page.locator('button').filter({ hasText: 'Clinical' })).toBeVisible();
            await expect(page.locator('button').filter({ hasText: 'Orders' })).toBeVisible();
        }
    });

    test('should navigate to Ops Command Center', async ({ page }) => {
        await page.goto('/ops');
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('Ops Command Center')).toBeVisible();
        await expect(page.getByText('Bed Census')).toBeVisible();
    });

    test('should navigate to Triage view', async ({ page }) => {
        await page.goto('/?view=triage');
        await page.waitForLoadState('networkidle');

        // Should show triage-related content
        await expect(page.getByText(/Triage|Admission/i).first()).toBeVisible();
    });
});

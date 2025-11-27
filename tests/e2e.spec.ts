import { test, expect } from '@playwright/test';

test.describe('MedFlow AI E2E', () => {
    // Increase timeout for slower environments
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Login if needed
        const emailInput = page.locator('[data-testid="login-email-input"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill('doctor@medflow.ai');
            await page.fill('[data-testid="login-password-input"]', 'password123');
            await page.click('[data-testid="login-submit-button"]');
        }
        // Verify Dashboard loads
        await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible({ timeout: 20000 });
    });

    test('should register a new patient and navigate to details', async ({ page }) => {
        // Navigate to Reception
        await page.click('[data-testid="nav-reception"]');
        await expect(page.locator('[data-testid="register-patient-button"]')).toBeVisible();

        // Fill form
        const timestamp = Date.now();
        const patientName = `Test Patient ${timestamp}`;
        await page.fill('[data-testid="patient-name-input"]', patientName);
        await page.fill('[data-testid="patient-age-input"]', '30');
        await page.selectOption('select[name="gender"]', 'Male');
        await page.fill('input[name="phone"]', '555-0123');
        await page.fill('[data-testid="patient-complaint-input"]', 'Severe headache');

        // Submit
        await page.click('[data-testid="register-patient-button"]');

        // Should redirect to Dashboard
        await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible({ timeout: 20000 });

        // Verify patient is in list
        const patientCard = page.locator(`div[role="button"]:has-text("${patientName}")`).first();
        await expect(patientCard).toBeVisible({ timeout: 10000 });

        // Navigate to Patient Detail
        await patientCard.click();

        // Verify URL
        await expect(page).toHaveURL(/\/patient\/.+/);

        // Check Tabs
        await expect(page.locator('button:has-text("Clinical File")')).toBeVisible();
        await expect(page.locator('button:has-text("Orders")')).toBeVisible();
        await expect(page.locator('button:has-text("MedView")')).toBeVisible();

        // Default tab is Clinical File
        // Check Accordions
        await expect(page.locator('button:has-text("History")')).toBeVisible();

        // Switch to Orders Tab
        await page.click('button:has-text("Orders")');
        await expect(page.locator('text=Active Orders')).toBeVisible();

        // Switch to MedView Tab
        await page.click('button:has-text("MedView")');
        await expect(page.locator('text=AI Handover Summary')).toBeVisible();
    });
});

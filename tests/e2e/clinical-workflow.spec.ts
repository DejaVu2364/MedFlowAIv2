
import { test, expect } from '@playwright/test';

test.describe('Clinical Workflow', () => {
    // Navigate to a specific patient before each test
    // In a real scenario, we might create a fresh patient via API first
    const patientUrl = 'http://localhost:3000/patient/PAT-1764662772306/clinical';

    test.beforeEach(async ({ page }) => {
        await page.goto(patientUrl);
    });

    test('Draft Scribe: Verify UI elements', async ({ page }) => {
        // Check for Voice Input button
        await expect(page.getByRole('button', { name: /Start Recording/i }).or(page.locator('button:has-text("Microphone")'))).toBeVisible();

        // Check for Subjective/Objective fields
        await expect(page.getByPlaceholder(/Patient reports.../i)).toBeVisible();
    });

    test('Sign Off & Plan: Trigger AI Orders', async ({ page }) => {
        // Ensure we are in a state ready to sign off
        // Note: dependent on data state. Ideally fixtures reset this.

        const signOffBtn = page.getByRole('button', { name: /Sign Off/i });
        await expect(signOffBtn).toBeVisible();
        await signOffBtn.click();

        // Handle Dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: /Confirm/i }).click();

        // Verify Toast or Success State
        await expect(page.getByText(/Orders generated/i)).toBeVisible({ timeout: 10000 });
    });
});

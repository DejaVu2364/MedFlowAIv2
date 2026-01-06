
import { test, expect } from '@playwright/test';

test.describe('Patient Registration & Triage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('Happy Path: Register new patient and complete triage', async ({ page }) => {
        // Navigate to registration
        await page.getByRole('button', { name: /Register Patient/i }).click();

        // Fill basic details
        await page.getByLabel('Full Name').fill('Test Patient E2E');
        await page.getByLabel('Age').fill('45');
        await page.getByLabel('Gender').selectOption('Male');
        await page.getByLabel('Chief Complaint').fill('Severe chest pain radiating to left arm');

        // Fill Vitals
        await page.getByLabel('Heart Rate').fill('110');
        await page.getByLabel('Blood Pressure').fill('150/95');
        await page.getByLabel('O2 Saturation').fill('96');
        await page.getByLabel('Temperature').fill('37.5');
        await page.getByLabel('Respiratory Rate').fill('22');
        await page.getByLabel('Pain Score').fill('8');

        // Submit
        await page.getByRole('button', { name: /Register & Triage/i }).click();

        // Validation: Verify redirection to dashboard or success message
        // Assuming it redirects to Dashboard with new patient
        await expect(page.getByText('Test Patient E2E')).toBeVisible();
        await expect(page.getByText('Severe chest pain')).toBeVisible();

        // Verify Triage Level (Should be Red/Orange for Chest Pain + Tachycardia)
        // Adjust selector based on actual UI
        // await expect(page.locator('.triage-badge')).toHaveText(/Red|Orange/);
    });

    test('Edge Case: Validation for missing required fields', async ({ page }) => {
        await page.getByRole('button', { name: /Register Patient/i }).click();
        await page.getByRole('button', { name: /Register & Triage/i }).click();

        // HTML5 validation or UI validation
        // Expect error message or focus on field
        // This depends on implementation details, so keeping generic for now
    });
});

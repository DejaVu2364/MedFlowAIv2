
import { test, expect } from '@playwright/test';

test.describe('Rounds & Discharge', () => {
    const roundsUrl = 'http://localhost:3000/patient/PAT-1764662772306/clinical'; // Rounds often in Clinical tab subview

    test('View Rounds', async ({ page }) => {
        await page.goto(roundsUrl);
        // Navigate to Rounds tab if it's a sub-tab
        const roundsTab = page.getByRole('tab', { name: /Rounds/i });
        if (await roundsTab.isVisible()) {
            await roundsTab.click();
            await expect(page.getByText(/New Round/i)).toBeVisible();
        }
    });
});

test.describe('Discharge', () => {
    const dischargeUrl = 'http://localhost:3000/patient/PAT-1764662772306/discharge';

    test.beforeEach(async ({ page }) => {
        await page.goto(dischargeUrl);
    });

    test('Generate Discharge Summary', async ({ page }) => {
        const genBtn = page.getByRole('button', { name: /Generate/i });
        // Might be disabled if already generated.
        if (await genBtn.isEnabled()) {
            await genBtn.click();
            // Wait for AI
            await expect(page.getByText(/Summary generated/i)).toBeVisible({ timeout: 15000 });
        }

        await expect(page.getByText(/Course in Hospital/i)).toBeVisible();
    });
});

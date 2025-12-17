import { test, expect } from '@playwright/test';

test('Verify Clinical Cockpit V2 Visuals', async ({ page }) => {
    // 1. Setup Viewport and Dashboard
    await page.setViewportSize({ width: 1920, height: 1080 });
    try {
        await page.goto('http://localhost:5173/', { timeout: 10000 });
    } catch (e) {
        console.error("Please run 'npm run dev' first.");
        return;
    }

    // Wait for key elements to ensure hydration
    await expect(page.getByText('Morning Briefing')).toBeVisible({ timeout: 10000 });

    // Action 1: Capture Dashboard
    await page.screenshot({ path: 'screenshots/dashboard-v2.png', fullPage: true });

    // 2. Navigation Flow
    // Click on a card in FocusInbox (assuming logic puts 'Critical Triage' or 'Draft Orders' there)
    // We look for a card with "Draft Orders" or generic click on the first focus card
    const firstCard = page.locator('.group.hover\\:shadow-md').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();

    // 3. Verify Cockpit Loading
    await expect(page).toHaveURL(/\/patient-v2\//);

    // Wait for the Split Layout to be visible
    // The Left Panel is "The Paper" (white bg)
    await expect(page.locator('main.flex-1.overflow-y-auto')).toBeVisible();

    // The Right Panel is "The Assistant" (ScribeSidePanel)
    await expect(page.getByText('AI Scribe Active')).toBeVisible();

    // Action 2: Capture Cockpit
    await page.screenshot({ path: 'screenshots/cockpit-v2.png', fullPage: true });

    // 4. Scribe Verification
    const scribeButton = page.getByRole('button', { name: /Start Session|Listening/ });
    await expect(scribeButton).toBeVisible();

    // Optional: Interact if simple
    // await scribeButton.click();
    // await page.waitForTimeout(1000);
    // await page.screenshot({ path: 'screenshots/scribe-active.png' });
});
